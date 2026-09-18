// One-time descriptive binding restoration; no runtime behavior changes.
import fs from 'node:fs';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
import {format} from 'prettier';
const traverse=traverseModule.default,generate=generateModule.default;
const maps={
 'app/diffy-squares.jsx':{DiffySquaresScreen:{e:'router',s:'phase',f:'currentCorners',C:'initialCorners',N:'currentGenIndex',z:'totalGens',W:'totalSteps',_:'userAnswers',k:'answerStates',G:'confirmedGenerations',M:'isLastGen',Z:'skipIntroAnimation',H:'start',E:'setAnswer',L:'advanceGeneration',F:'resetAnswers',O:'reset',q:'cornerInputs',K:'setCornerInputs',X:'hasFocusedInput',Y:'setHasFocusedInput',$:'cornerRefs',J:'midpointRefs',Q:'keyboardHeight',U:'pendingVariation',ee:'zoomScale',te:'panResponder',re:'resetZoom',oe:'showCornerInputs',ne:'setShowCornerInputs',ae:'cornerOpacity',se:'inputPhaseOpacity',le:'playingPhaseOpacity',ie:'flyAnimations',ue:'midpointEnterScale',de:'showMidpoints',ce:'setShowMidpoints',fe:'displayGeneration',pe:'setDisplayGeneration',ge:'isFlying',he:'setIsFlying',ye:'transitionInProgress',me:'suppressNewestLabels',xe:'setSuppressNewestLabels',be:'answersLocked',Ve:'completeGeneration',Ce:'startGame',Te:'canStart',De:'padding',Se:'sideLength',je:'currentPoints',ve:'midpointPositions',Ie:'visibleGenerations',we:'animateGenIndex',Ne:'showLabels',Ae:'frozenMidpoints',Be:'shouldShowMidpoints',Re:'displayMidpoints'}},
 'components/DiffySquaresViz.jsx':{lineLength:{e:'x1',t:'y1',n:'x2',r:'y2'},midpoints:{e:'points'},squareCorners:{e:'size',t:'padding',n:'side'},DrawingLine:{e:'x1',r:'y1',o:'x2',s:'y2',l:'stroke',i:'strokeWidth',f:'animate',p:'delay',y:'length',x:'progress',j:'dashOffset'},SpringLabel:{e:'cx',r:'cy',l:'value',i:'color',c:'fontSize',f:'animate',h:'delay',p:'opacity',y:'scale',x:'radius'},DiffySquaresViz:{e:'generations',n:'size',l:'animateGenIndex',c:'suppressNewestLabels',h:'showLabels',y:'padding',C:'labelsReady',_:'setLabelsReady',V:'pointsByGeneration',D:'points',T:'centerX',A:'centerY',M:'generationCount'}},
 'components/MidpointInput.jsx':{MidpointInput:{e:'side',n:'state',p:'value',x:'onChangeText',y:'inputRef',C:'x',b:'y',_:'genIndex',j:'outerSide',k:'enterAnim',v:'flyX',w:'flyY',A:'opacityAnim',S:'shakeOffset',T:'shake',E:'boxSize',M:'fontSize',P:'borderColor',z:'backgroundColor'}},
 'app/index.web.jsx':{IntroScreen:{e:'router',s:'hasSeenIntro',f:'markIntroSeen',w:'buttonOpacity',v:'seenIntro',j:'videoRef',x:'videoSource',C:'containerRef',S:'viewport',P:'setViewport',R:'buttonTop',_:'setButtonTop',k:'updateLayout',H:'videoHeight'}},
 'app/topics.jsx':{DiffyIcon:{e:'size'},TopicsScreen:{e:'router'}},
 'hooks/usePinchZoom.js':{usePinchZoom:{e:'enabled',c:'zoomScale',l:'savedScale',f:'startDistance',v:'lastTap',p:'enabledRef',h:'panResponder',R:'resetZoom'}},
 'context/SessionContext.js':{},
 'utils/geometry.js':{pushFromCenter:{t:'x',n:'y',o:'centerX',u:'centerY',c:'offset',s:'distance',h:'scale'},midpointBoxSize:{o:'generation',u:'outerSide',c:'sideLength',s:'proportionalSize'}},
};
for(const [file,functions] of Object.entries(maps)){
 const ast=parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),{sourceType:'module',plugins:['jsx']});
 traverse(ast,{FunctionDeclaration(p){const map=functions[p.node.id.name];if(map)for(const [from,to] of Object.entries(map))if(p.scope.hasOwnBinding(from))p.scope.rename(from,to);},UnaryExpression(p){if(p.node.operator==='!'&&t.isNumericLiteral(p.node.argument))p.replaceWith(t.booleanLiteral(!p.node.argument.value));}});
 fs.writeFileSync(new URL('../'+file,import.meta.url),await format(generate(ast).code,{parser:'babel'}));
}
