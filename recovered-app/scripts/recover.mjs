// Reproduce the initial recovery into a scratch directory, never over edited source.
import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
import {format} from 'prettier';
const traverse=traverseModule.default, generate=generateModule.default;
const root=path.resolve(import.meta.dirname,'../..');
const modules=JSON.parse(fs.readFileSync(path.join(root,'recovery/original-modules.json')));
const output=process.argv[2]; if(!output) throw Error('Supply a scratch output directory');
const paths={10:'app/_layout.jsx',668:'constants/theme.js',669:'context/SessionContext.js',670:'app/diffy-squares.jsx',671:'components/DiffySquaresViz.jsx',696:'utils/geometry.js',697:'hooks/useDiffySquares.js',698:'hooks/useKeyboardHeight.js',699:'hooks/usePinchZoom.js',700:'components/MidpointInput.jsx',701:'hooks/useShake.js',733:'app/index.web.jsx',734:'app/topics.jsx'};
const rn={266:'Animated',281:'Dimensions',325:'Image',408:'Keyboard',477:'KeyboardAvoidingView',124:'Platform',363:'Pressable',146:'StyleSheet',133:'Text',388:'TextInput',272:'View',280:'ScrollView',467:'PanResponder'};
const external={6:['react/jsx-runtime','jsxRuntime'],11:['expo-router','Router'],31:['react','React'],375:['react-native-safe-area-context','SafeArea'],665:['expo-status-bar','StatusBarModule'],672:['react-native-svg','Svg']};
const names={10:'RootLayout',668:'Theme',669:'Session',670:'DiffySquares',671:'Visualization',696:'Geometry',697:'Game',698:'KeyboardHeight',699:'PinchZoom',700:'MidpointInputModule',701:'Shake',733:'Intro',734:'Topics'};
const renames={10:{f:'RootLayout'},668:{t:'Colors'},669:{n:'SessionContext'},670:{w:'SQUARE_SIZE',N:'INITIAL_POINTS',A:'CORNER_INPUT_POSITIONS',B:'OUTER_SIDE',R:'EMPTY_CORNERS',z:'DiffySquaresScreen',P:'styles'},671:{c:'AnimatedLine',f:'GENERATION_COLORS',h:'EDGE_DRAW_MS',p:'LABEL_DELAY_MS',y:'TOTAL_DRAW_MS',x:'VIZ_PADDING',j:'LABEL_FADE_THRESHOLD',C:'lineLength',b:'midpoints',v:'squareCorners',w:'DrawingLine',k:'SpringLabel',_:'DiffySquaresViz'},696:{},697:{c:'correctDifference',u:'nextGeneration',o:'isZero',s:'EMPTY_ANSWERS',a:'EMPTY_STATES'},699:{o:'MIN_SCALE',s:'MAX_SCALE'},700:{p:'MidpointInput',h:'styles'},733:{p:'VIDEO_BOTTOM_SPACE',w:'IntroScreen',y:'styles'},734:{y:'DiffyIcon',k:'activities',b:'TopicsScreen',C:'styles'}};
for(const [id,file] of Object.entries(paths)){
 const fn=parse('('+modules[id].factory+')').program.body[0].expression;
 const requireName=fn.params[1].name, exportsName=fn.params[5].name, depName=fn.params[6].name;
 const ast=t.file(t.program(fn.body.body));const imports=[];const canonical=new Map();
 modules[id].deps.forEach((dep,i)=>{
  let name,source,imported;
  if(rn[dep]) {name=rn[dep];source='react-native';imported=name;}
  else if(external[dep]) [source,name]=external[dep];
  else if(paths[dep]) {source=path.posix.relative(path.posix.dirname(file),paths[dep]);if(!source.startsWith('.'))source='./'+source;name=names[dep];}
  else if(dep===702||dep===732){name=dep===702?'logoAsset':'introAsset';source=dep===702?'../assets/logo-mark.png':'../assets/intro.mp4';imported='default';}
  else throw Error(`Unmapped ${id} -> ${dep}`);
  canonical.set(i,{name,direct:!!imported});
  imports.push(imported==='default'?t.importDeclaration([t.importDefaultSpecifier(t.identifier(name))],t.stringLiteral(source)):imported?t.importDeclaration([t.importSpecifier(t.identifier(name),t.identifier(imported))],t.stringLiteral(source)):t.importDeclaration([t.importNamespaceSpecifier(t.identifier(name))],t.stringLiteral(source)));
 });
 const interops=new Set();
 traverse(ast,{FunctionDeclaration(p){if(p.node.params.length===1&&generate(p.node.body).code.includes('__esModule')){interops.add(p.node.id.name);p.remove();}}});
 const direct=new Set([...canonical.values()].filter(x=>x.direct).map(x=>x.name));
 traverse(ast,{CallExpression:{exit(p){
  const n=p.node;
  if(t.isIdentifier(n.callee,{name:requireName})&&t.isMemberExpression(n.arguments[0])&&t.isIdentifier(n.arguments[0].object,{name:depName})) {p.replaceWith(t.identifier(canonical.get(n.arguments[0].property.value).name));return;}
  if(t.isIdentifier(n.callee)&&interops.has(n.callee.name)) {p.replaceWith(n.arguments[0]);return;}
  if(t.isMemberExpression(n.callee)&&t.isIdentifier(n.callee.object,{name:'Object'})&&t.isIdentifier(n.callee.property,{name:'defineProperty'})&&t.isIdentifier(n.arguments[0],{name:exportsName})){
   const key=n.arguments[1].value;
   if(key==='__esModule') {p.replaceWith(t.numericLiteral(0));return;}
   const getter=n.arguments[2].properties.find(x=>x.key.name==='get').value;
   p.replaceWith(t.assignmentExpression('=',t.memberExpression(t.identifier(exportsName),t.identifier(key)),getter.body.body[0].argument));
  }
 }}});
 // Expand the declaration list, and remove aliases introduced by Metro.
 traverse(ast,{VariableDeclaration(p){if(p.node.declarations.length>1&&p.parentPath.isProgram())p.replaceWithMultiple(p.node.declarations.map(d=>t.variableDeclaration(p.node.kind,[d])));}});
 for(let pass=0;pass<5;pass++) traverse(ast,{Program(p){p.scope.crawl();},VariableDeclarator(p){if(!p.parentPath.parentPath.isProgram()||!t.isIdentifier(p.node.id)||!t.isIdentifier(p.node.init))return;const name=p.node.id.name,value=p.node.init.name;const binding=p.scope.getBinding(name);if(!binding||!binding.constant)return;for(const ref of binding.referencePaths)ref.replaceWith(t.identifier(value));if(direct.has(value))direct.add(name);p.parentPath.remove();}});
 traverse(ast,{MemberExpression(p){if(t.isIdentifier(p.node.object)&&direct.has(p.node.object.name)&&t.isIdentifier(p.node.property,{name:'default'}))p.replaceWith(p.node.object);},SequenceExpression:{exit(p){const e=p.node.expressions.filter(e=>!t.isNumericLiteral(e,{value:0}));if(e.length===1)p.replaceWith(e[0]);else p.node.expressions=e;}}});
 // Top-level sequence statements contain the original export assignments.
 traverse(ast,{ExpressionStatement(p){if(p.parentPath.isProgram()&&t.isSequenceExpression(p.node.expression))p.replaceWithMultiple(p.node.expression.expressions.map(e=>t.expressionStatement(e)));}});
 const exports=[];
 traverse(ast,{ExpressionStatement(p){const n=p.node.expression;if(t.isNumericLiteral(n)||t.isIdentifier(n)){p.remove();return;}if(t.isAssignmentExpression(n)&&t.isMemberExpression(n.left)&&t.isIdentifier(n.left.object,{name:exportsName})){
  const name=n.left.property.name;
  if(name==='default') exports.push(t.exportDefaultDeclaration(n.right));
  else if(t.isIdentifier(n.right))exports.push(t.exportNamedDeclaration(null,[t.exportSpecifier(n.right,t.identifier(name))]));
  else if(t.isFunctionExpression(n.right)){const f=t.functionDeclaration(t.identifier(name),n.right.params,n.right.body);p.replaceWith(t.exportNamedDeclaration(f));return;}
  else throw Error('Unknown export');p.remove();
 }}});
 ast.program.body.push(...exports);ast.program.body.unshift(...imports);
 traverse(ast,{Program(p){for(const [a,b] of Object.entries(renames[id]||{}))if(p.scope.hasOwnBinding(a))p.scope.rename(a,b);}});
 // Convert the JSX runtime calls back to JSX syntax where props are explicit.
 function jsxName(node){if(t.isStringLiteral(node))return t.jsxIdentifier(node.value);if(t.isIdentifier(node))return t.jsxIdentifier(node.name);if(t.isMemberExpression(node))return t.jsxMemberExpression(jsxName(node.object),jsxName(node.property));throw Error('Unsupported JSX name');}
 traverse(ast,{CallExpression:{exit(p){const n=p.node;if(!t.isMemberExpression(n.callee)||!t.isIdentifier(n.callee.object,{name:'jsxRuntime'})||!['jsx','jsxs'].includes(n.callee.property.name)||!t.isObjectExpression(n.arguments[1]))return;
 const attrs=[],children=[];for(const prop of n.arguments[1].properties){if(t.isSpreadElement(prop)){attrs.push(t.jsxSpreadAttribute(prop.argument));continue;}const key=prop.key.name||prop.key.value;if(key==='children'){const values=t.isArrayExpression(prop.value)?prop.value.elements:[prop.value];for(const v of values)children.push(t.isJSXElement(v)?v:t.jsxExpressionContainer(v));}else attrs.push(t.jsxAttribute(t.jsxIdentifier(key),t.jsxExpressionContainer(prop.value)));}
 if(n.arguments[2])attrs.push(t.jsxAttribute(t.jsxIdentifier('key'),t.jsxExpressionContainer(n.arguments[2])));
 const name=jsxName(n.arguments[0]);p.replaceWith(t.jsxElement(t.jsxOpeningElement(name,attrs,children.length===0),children.length?t.jsxClosingElement(name):null,children));
 }}});
 const dest=path.resolve(output,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,await format('// Recovered from Metro module '+id+'. See ../../recovery/README.md.\n'+generate(ast).code,{parser:'babel'}));
}
console.log(`Recovered ${Object.keys(paths).length} modules into ${output}`);
