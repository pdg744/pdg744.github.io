import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
import {format} from 'prettier';
const traverse=traverseModule.default,generate=generateModule.default;
const root=path.resolve(import.meta.dirname,'..');
const files=fs.readdirSync(root,{recursive:true}).filter(file=>/^(app|components|constants|context|hooks|utils|game)\//.test(file)&&/\.(js|jsx)$/.test(file));
for(const file of files){
 const ast=parse(fs.readFileSync(path.join(root,file),'utf8'),{sourceType:'module',plugins:['jsx']});
 traverse(ast,{
  UnaryExpression(p){if(p.node.operator==='!'&&t.isNumericLiteral(p.node.argument))p.replaceWith(t.booleanLiteral(!p.node.argument.value));},
  ObjectProperty(p){if(t.isIdentifier(p.node.key)&&t.isIdentifier(p.node.value)&&p.node.key.name===p.node.value.name)p.node.shorthand=true;},
  VariableDeclaration(p){if(p.node.declarations.length>1&&(p.parentPath.isBlockStatement()||p.parentPath.isProgram()))p.replaceWithMultiple(p.node.declarations.map(d=>t.variableDeclaration(p.node.kind,[d])));},
  ExpressionStatement(p){if(t.isSequenceExpression(p.node.expression))p.replaceWithMultiple(p.node.expression.expressions.map(e=>t.expressionStatement(e)));},
  ReturnStatement(p){if(t.isSequenceExpression(p.node.argument)){const expressions=[...p.node.argument.expressions];const last=expressions.pop();p.replaceWithMultiple([...expressions.map(e=>t.expressionStatement(e)),t.returnStatement(last)]);}},
  JSXOpeningElement(p){if(t.isJSXIdentifier(p.node.name,{name:'Pressable'})&&!p.node.attributes.some(a=>a.name?.name==='accessibilityRole'))p.node.attributes.unshift(t.jsxAttribute(t.jsxIdentifier('accessibilityRole'),t.stringLiteral('button')));},
  CallExpression(p){const n=p.node;if(t.isMemberExpression(n.callee)&&t.isIdentifier(n.callee.object,{name:'jsxRuntime'})&&t.isCallExpression(n.arguments[1])&&t.isMemberExpression(n.arguments[1].callee)&&t.isIdentifier(n.arguments[1].callee.object,{name:'Object'})&&t.isIdentifier(n.arguments[1].callee.property,{name:'assign'}))n.arguments[1]=t.objectExpression(n.arguments[1].arguments.flatMap(arg=>t.isObjectExpression(arg)?arg.properties:[t.spreadElement(arg)]));},
 });
 const jsxName=n=>t.isStringLiteral(n)?t.jsxIdentifier(n.value):t.isIdentifier(n)?t.jsxIdentifier(n.name):t.jsxMemberExpression(jsxName(n.object),jsxName(n.property));
 traverse(ast,{CallExpression:{exit(p){const n=p.node;if(!t.isMemberExpression(n.callee)||!t.isIdentifier(n.callee.object,{name:'jsxRuntime'})||!['jsx','jsxs'].includes(n.callee.property.name)||!t.isObjectExpression(n.arguments[1]))return;
 const attrs=[],children=[];for(const prop of n.arguments[1].properties){if(t.isSpreadElement(prop)){attrs.push(t.jsxSpreadAttribute(prop.argument));continue;}const key=prop.key.name||prop.key.value;if(key==='children'){const values=t.isArrayExpression(prop.value)?prop.value.elements:[prop.value];for(const v of values)children.push(t.isJSXElement(v)?v:t.jsxExpressionContainer(v));}else attrs.push(t.jsxAttribute(t.jsxIdentifier(key),t.jsxExpressionContainer(prop.value)));}if(n.arguments[2])attrs.push(t.jsxAttribute(t.jsxIdentifier('key'),t.jsxExpressionContainer(n.arguments[2])));
 const name=jsxName(n.arguments[0]);p.replaceWith(t.jsxElement(t.jsxOpeningElement(name,attrs,!children.length),children.length?t.jsxClosingElement(name):null,children));
 }}});
 // Merge React Native imports and drop the now-unused JSX runtime imports.
 traverse(ast,{Program(p){p.scope.crawl();for(const child of p.get('body'))if(child.isImportDeclaration()){
  for(const spec of child.get('specifiers')){const binding=p.scope.getBinding(spec.node.local.name);if(binding&&!binding.referenced)spec.remove();}
  if(!child.node.specifiers.length)child.remove();
 }}});
 const nativeImports=ast.program.body.filter(n=>t.isImportDeclaration(n)&&n.source.value==='react-native');
 if(nativeImports.length>1){nativeImports[0].specifiers=nativeImports.flatMap(n=>n.specifiers);ast.program.body=ast.program.body.filter(n=>!nativeImports.slice(1).includes(n));}
 fs.writeFileSync(path.join(root,file),await format(generate(ast).code,{parser:'babel'}));
}
