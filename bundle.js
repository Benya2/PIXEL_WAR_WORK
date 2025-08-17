const _0x363e43=_0x22c9;(function(_0x1df813,_0x3f25a4){const _0x34f253=_0x22c9,_0x55c0c8=_0x1df813();while(!![]){try{const _0x585148=-parseInt(_0x34f253(0x120))/0x1+parseInt(_0x34f253(0x11b))/0x2*(parseInt(_0x34f253(0x179))/0x3)+-parseInt(_0x34f253(0x132))/0x4*(parseInt(_0x34f253(0x13c))/0x5)+-parseInt(_0x34f253(0x11e))/0x6+parseInt(_0x34f253(0x16b))/0x7*(-parseInt(_0x34f253(0x14c))/0x8)+-parseInt(_0x34f253(0x107))/0x9*(parseInt(_0x34f253(0x105))/0xa)+parseInt(_0x34f253(0x116))/0xb*(parseInt(_0x34f253(0x124))/0xc);if(_0x585148===_0x3f25a4)break;else _0x55c0c8['push'](_0x55c0c8['shift']());}catch(_0x183b77){_0x55c0c8['push'](_0x55c0c8['shift']());}}}(_0xa76a,0x5837d));import{initializeApp}from'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js';import{getFirestore,collection,doc,setDoc,onSnapshot,deleteDoc,getDocs}from'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';import{getDatabase,ref,remove}from'https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js';import{getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut}from'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';const firebaseConfig={'apiKey':_0x363e43(0x155),'authDomain':_0x363e43(0x170),'projectId':_0x363e43(0x129),'storageBucket':_0x363e43(0x140),'messagingSenderId':_0x363e43(0xfb),'appId':_0x363e43(0x134)},app=initializeApp(firebaseConfig),db=getFirestore(app),rtdb=getDatabase(app),auth=getAuth(app),coordsDisplayEl=document[_0x363e43(0xee)]('coordsDisplay'),colorsChoiceEl=document[_0x363e43(0xee)](_0x363e43(0x16c)),paletteToggle=document['getElementById'](_0x363e43(0xf1)),game=document[_0x363e43(0xee)](_0x363e43(0x102)),ctx=game[_0x363e43(0x144)]('2d'),cursor=document[_0x363e43(0xee)]('cursor'),reloadTimerEl=document[_0x363e43(0xee)]('reloadTimer'),adminPanel=document['getElementById'](_0x363e43(0x151)),clearAllPixelsBtn=document['getElementById'](_0x363e43(0xf8)),banUserBtn=document['getElementById'](_0x363e43(0x135)),authButton=document[_0x363e43(0xee)](_0x363e43(0x164)),coordsInput=document['getElementById'](_0x363e43(0x106)),addPixelBtn=document[_0x363e43(0xee)]('addPixelBtn'),removePixelBtn=document['getElementById']('removePixelBtn'),teleportInput=document['getElementById'](_0x363e43(0x115)),teleportBtn=document['getElementById']('teleportBtn');teleportBtn[_0x363e43(0x12d)]('click',()=>{const _0x530b00=_0x363e43;if(!auth[_0x530b00(0x15a)]||auth[_0x530b00(0x15a)][_0x530b00(0x157)]!==_0x530b00(0x16f))return alert(_0x530b00(0x12b));const _0x53ad38=teleportInput[_0x530b00(0x152)][_0x530b00(0x159)]();if(!_0x53ad38)return;const [_0x42930d,_0x57123f]=_0x53ad38[_0x530b00(0x180)](/\s+/),_0x99fa09=parseInt(_0x42930d),_0x4acfa6=parseInt(_0x57123f);if(Number[_0x530b00(0x117)](_0x99fa09)||Number[_0x530b00(0x117)](_0x4acfa6))return alert(_0x530b00(0x146));const _0x4e88fc=_0x99fa09*gridCellSize,_0x722fb1=_0x4acfa6*gridCellSize;camX=_0x4e88fc-game[_0x530b00(0x14f)]/0x2/scale,camY=_0x722fb1-game['height']/0x2/scale,renderAll();}),ctx[_0x363e43(0x176)]=![];const gridCellSize=0xa;game['width']=0x4b0,game['height']=0x258;let currentColor=_0x363e43(0x10a),canPlace=!![];const reloadTime=0x5,colors=[_0x363e43(0xfa),_0x363e43(0x161),'rgb(228,\x20228,\x20228)',_0x363e43(0x181),'rgb(196,\x20196,\x20196)',_0x363e43(0x13b),'rgb(136,\x20136,\x20136)',_0x363e43(0x12e),'rgb(78,\x2078,\x2078)',_0x363e43(0x145),_0x363e43(0x11c),_0x363e43(0xf2),_0x363e43(0x112),'rgb(104,\x20131,\x2056)',_0x363e43(0x121),'rgb(0,\x20101,\x2019)','rgb(255,\x2084,\x20178)',_0x363e43(0x158),_0x363e43(0x154),'rgb(0,\x20211,\x20221)',_0x363e43(0x111),_0x363e43(0x114),_0x363e43(0x11a),_0x363e43(0x165),_0x363e43(0x17d),_0x363e43(0x153),_0x363e43(0xfe),_0x363e43(0x150),'rgb(160,\x20106,\x2066)',_0x363e43(0x131)];colorsChoiceEl[_0x363e43(0x100)]='',colors[_0x363e43(0xea)](_0x1850e0=>{const _0xea24d6=_0x363e43,_0x56348b=document[_0xea24d6(0x182)](_0xea24d6(0x130));_0x56348b['style'][_0xea24d6(0x133)]=_0x1850e0,_0x56348b[_0xea24d6(0x12d)](_0xea24d6(0x14a),()=>{const _0x568655=_0xea24d6;currentColor=_0x1850e0,document['querySelectorAll'](_0x568655(0x167))[_0x568655(0xea)](_0x11e59c=>_0x11e59c[_0x568655(0x125)][_0x568655(0xf7)](_0x568655(0x118))),_0x56348b['classList'][_0x568655(0x10d)]('selected');}),colorsChoiceEl[_0xea24d6(0x173)](_0x56348b);});const colorsChoice=document[_0x363e43(0xee)](_0x363e43(0x16c)),togglePalette=document[_0x363e43(0xee)](_0x363e43(0x137));togglePalette[_0x363e43(0x12d)](_0x363e43(0x14a),()=>{const _0x1200f3=_0x363e43;colorsChoice[_0x1200f3(0x108)][_0x1200f3(0x16d)]==='none'?colorsChoice[_0x1200f3(0x108)][_0x1200f3(0x16d)]=_0x1200f3(0x17f):colorsChoice['style'][_0x1200f3(0x16d)]=_0x1200f3(0x169);});const worldMap=new Image();worldMap[_0x363e43(0x175)]='world.png';const SCALE_TILE=0x28;let WORLD_W=0x4e20*SCALE_TILE,WORLD_H=0x4e20*SCALE_TILE,camX=0x0,camY=0x0,scale=0x1;const MIN_SCALE=0.005,MAX_SCALE=0x6;let isPanning=![],lastMouseX=0x0,lastMouseY=0x0;function clamp(_0x8872af,_0x3eb5a3,_0xbbd8b2){return Math['max'](_0x3eb5a3,Math['min'](_0xbbd8b2,_0x8872af));}function screenToWorld(_0x404864,_0x173809){const _0x34ecd0=_0x363e43,_0x58b31d=game[_0x34ecd0(0x160)](),_0x4e18ee=(_0x404864-_0x58b31d['left'])/scale+camX,_0x257be8=(_0x173809-_0x58b31d[_0x34ecd0(0x11f)])/scale+camY;return[_0x4e18ee,_0x257be8];}function snapToGrid(_0x5241d2,_0x14cead){const _0x24c49a=_0x363e43;return[Math[_0x24c49a(0x174)](_0x5241d2/gridCellSize)*gridCellSize,Math['floor'](_0x14cead/gridCellSize)*gridCellSize];}let hoverCellX=0x0,hoverCellY=0x0;const pixelsCache=new Map();let markers=[];function updateCoordsDisplay(){const _0x593854=_0x363e43;if(!coordsDisplayEl)return;const _0x2da5c2=Math['floor'](hoverCellX/gridCellSize),_0x171823=Math[_0x593854(0x174)](hoverCellY/gridCellSize);coordsDisplayEl[_0x593854(0x162)]=_0x593854(0x138)+_0x2da5c2+_0x593854(0x15f)+_0x171823;}const TILE_SIZE=0x3e8;let tiles=[];const offscreenCanvas=document[_0x363e43(0x182)]('canvas');offscreenCanvas[_0x363e43(0x14f)]=TILE_SIZE,offscreenCanvas[_0x363e43(0x104)]=TILE_SIZE;function _0xa76a(){const _0xf36c2f=['AIzaSyCwy4jVn9JIwXuIXVycYAv9EdPGPkgIJvA','Email:','email','rgb(202,\x20227,\x20255)','trim','currentUser','left','users/','Ready!','mouseup','\x20\x20Y:\x20','getBoundingClientRect','rgb(96,\x2064,\x2040)','textContent','uid','authButton','rgb(0,\x200,\x20234)','mousedown','#colorsChoice\x20div','fillRect','none','contextmenu','49NAQypd','colorsChoice','display','Online\x20players:\x20','logo100153@gmail.com','pixellox.firebaseapp.com','lineTo','#FFFFFF','appendChild','floor','src','imageSmoothingEnabled','color','clear','86883HXPHKm','beginPath','preventDefault','\x20sec','rgb(254,\x20164,\x2096)','Удалено','grid','split','rgb(245,\x20223,\x20176)','createElement','shiftKey','pixels','forEach','clearRect','strokeStyle','button','getElementById','clientX','ctrlKey','paletteToggle','rgb(2,\x20190,\x201)','#ccc','val','innerText','Добавлено','remove','clearAllPixels','stroke','rgb(255,\x20255,\x20255)','461991610382','drawImage','then','rgb(229,\x20149,\x200)','wheel','innerHTML','mousemove','game','fillStyle','height','38230usFqYQ','coordsInput','1503lFCkdV','style','ceil','#000000','naturalWidth','set','add','naturalHeight','Reload:\x20','push','rgb(229,\x200,\x200)','rgb(244,\x20179,\x20174)','complete','rgb(0,\x20131,\x20199)','teleportInput','24182422DNPQXa','isNaN','selected','Пользователь\x20забанен!','rgb(154,\x200,\x200)','28QPZenE','rgb(0,\x200,\x200)','img','2435442DjhKPi','top','283012arDNxv','rgb(255,\x20167,\x20209)','clientY','setTransform','12xxafaX','classList','Password:','Log\x20In','image/png','pixellox','Account\x20created!','Только\x20админ!','altKey','addEventListener','rgb(229,\x20217,\x200)','#eef6ff','div','rgb(130,\x200,\x20128)','348vEQHNY','backgroundColor','1:461991610382:web:2a5ae293dde4a754c2d45f','banUser','\x20пикселей:\x20','togglePalette','X:\x20','metaKey','onload','rgb(255,\x20248,\x20137)','31330DnQkXw','Enter\x201\x20to\x20sign\x20in,\x20or\x202\x20to\x20create\x20a\x20new\x20account:','min','data','pixellox.firebasestorage.app','Log\x20Out','input','now','getContext','rgb(148,\x20224,\x2068)','Введите\x20корректные\x20координаты\x20X\x20Y','rgba(0,0,0,0.12)','rgba(255,0,0,0.5)','error','click','moveTo','422872TJMGln','ref','toDataURL','width','rgb(207,\x20110,\x20228)','adminPanel','value','rgb(25,\x2025,\x20115)','rgb(255,\x20101,\x20101)'];_0xa76a=function(){return _0xf36c2f;};return _0xa76a();}const offCtx=offscreenCanvas[_0x363e43(0x144)]('2d',{'willReadFrequently':!![]});offCtx['imageSmoothingEnabled']=![],worldMap[_0x363e43(0x13a)]=()=>{const _0x482bee=_0x363e43,_0x10da5b=worldMap[_0x482bee(0x10b)]||0x4e20,_0x59cec7=worldMap[_0x482bee(0x10e)]||0x4e20;WORLD_W=_0x10da5b*SCALE_TILE,WORLD_H=_0x59cec7*SCALE_TILE;const _0x5d17cd=Math['ceil'](_0x10da5b/TILE_SIZE),_0x8bdccd=Math[_0x482bee(0x109)](_0x59cec7/TILE_SIZE);tiles=[];for(let _0x72f0ec=0x0;_0x72f0ec<_0x5d17cd;_0x72f0ec++){for(let _0x47c731=0x0;_0x47c731<_0x8bdccd;_0x47c731++){const _0x41e808=_0x72f0ec*TILE_SIZE,_0xb8238d=_0x47c731*TILE_SIZE,_0x2b8040=Math[_0x482bee(0x13e)](TILE_SIZE,_0x10da5b-_0x41e808),_0x364511=Math[_0x482bee(0x13e)](TILE_SIZE,_0x59cec7-_0xb8238d);offCtx[_0x482bee(0xeb)](0x0,0x0,TILE_SIZE,TILE_SIZE),offCtx['drawImage'](worldMap,_0x41e808,_0xb8238d,_0x2b8040,_0x364511,0x0,0x0,_0x2b8040,_0x364511);const _0xfebe00=new Image();_0xfebe00[_0x482bee(0x175)]=offscreenCanvas[_0x482bee(0x14e)](_0x482bee(0x128));const _0x11357e=_0x41e808*SCALE_TILE,_0x25eed5=_0xb8238d*SCALE_TILE,_0x4dc785=_0x2b8040*SCALE_TILE,_0x3809aa=_0x364511*SCALE_TILE;tiles[_0x482bee(0x110)]({'img':_0xfebe00,'dx':_0x11357e,'dy':_0x25eed5,'dw':_0x4dc785,'dh':_0x3809aa});}}renderAll();};function renderAll(){const _0x1a3cc3=_0x363e43;ctx[_0x1a3cc3(0x176)]=![],ctx['setTransform'](0x1,0x0,0x0,0x1,0x0,0x0),ctx[_0x1a3cc3(0xeb)](0x0,0x0,game['width'],game[_0x1a3cc3(0x104)]),ctx['setTransform'](scale,0x0,0x0,scale,-camX*scale,-camY*scale);const _0x2d8af4=camX,_0x111c87=camY,_0x343c71=camX+game['width']/scale,_0x4ad571=camY+game[_0x1a3cc3(0x104)]/scale;for(const _0x388c79 of tiles){if(_0x388c79['dx']+_0x388c79['dw']<_0x2d8af4||_0x388c79['dx']>_0x343c71||_0x388c79['dy']+_0x388c79['dh']<_0x111c87||_0x388c79['dy']>_0x4ad571)continue;_0x388c79['img'][_0x1a3cc3(0x113)]&&_0x388c79[_0x1a3cc3(0x11d)][_0x1a3cc3(0x10b)]?ctx[_0x1a3cc3(0xfc)](_0x388c79[_0x1a3cc3(0x11d)],_0x388c79['dx'],_0x388c79['dy'],_0x388c79['dw'],_0x388c79['dh']):(ctx[_0x1a3cc3(0x103)]=_0x1a3cc3(0x12f),ctx[_0x1a3cc3(0x168)](_0x388c79['dx'],_0x388c79['dy'],_0x388c79['dw'],_0x388c79['dh']));}ctx[_0x1a3cc3(0x17a)](),ctx[_0x1a3cc3(0xec)]=_0x1a3cc3(0xf3);let _0x46ec1a=Math[_0x1a3cc3(0x174)](_0x2d8af4/gridCellSize)*gridCellSize;for(let _0xcd6963=_0x46ec1a;_0xcd6963<=_0x343c71;_0xcd6963+=gridCellSize){ctx[_0x1a3cc3(0x14b)](_0xcd6963,_0x111c87),ctx['lineTo'](_0xcd6963,_0x4ad571);}let _0x25422b=Math['floor'](_0x111c87/gridCellSize)*gridCellSize;for(let _0x4a3598=_0x25422b;_0x4a3598<=_0x4ad571;_0x4a3598+=gridCellSize){ctx[_0x1a3cc3(0x14b)](_0x2d8af4,_0x4a3598),ctx[_0x1a3cc3(0x171)](_0x343c71,_0x4a3598);}ctx[_0x1a3cc3(0xf9)](),pixelsCache['forEach'](_0x2b3c11=>{const _0x51fca1=_0x1a3cc3;_0x2b3c11[_0x51fca1(0x177)]!=='#FFFFFF'&&(ctx['fillStyle']=_0x2b3c11[_0x51fca1(0x177)],ctx[_0x51fca1(0x168)](_0x2b3c11['x'],_0x2b3c11['y'],gridCellSize,gridCellSize));}),ctx[_0x1a3cc3(0x103)]=_0x1a3cc3(0x148);for(const [_0x233486,_0x4321a4]of markers){ctx['fillRect'](_0x233486,_0x4321a4,gridCellSize,gridCellSize);}ctx['fillStyle']=_0x1a3cc3(0x147),ctx[_0x1a3cc3(0x168)](hoverCellX,hoverCellY,gridCellSize,gridCellSize),ctx[_0x1a3cc3(0x123)](0x1,0x0,0x0,0x1,0x0,0x0);}onSnapshot(collection(db,'pixels'),_0x3509dd=>{const _0x8763d3=_0x363e43;pixelsCache[_0x8763d3(0x178)](),_0x3509dd[_0x8763d3(0xea)](_0x267bee=>{const _0x2032e7=_0x8763d3,_0x35dec4=_0x267bee[_0x2032e7(0x13f)]();pixelsCache[_0x2032e7(0x10c)](_0x35dec4['x']+'-'+_0x35dec4['y'],_0x35dec4);}),renderAll();}),game[_0x363e43(0x12d)](_0x363e43(0x166),_0x542b1c=>{const _0x5fc1c4=_0x363e43;(_0x542b1c['button']===0x1||_0x542b1c[_0x5fc1c4(0xed)]===0x2||_0x542b1c[_0x5fc1c4(0x183)]||_0x542b1c[_0x5fc1c4(0xf0)]||_0x542b1c[_0x5fc1c4(0x139)]||_0x542b1c[_0x5fc1c4(0x12c)])&&(isPanning=!![],lastMouseX=_0x542b1c[_0x5fc1c4(0xef)],lastMouseY=_0x542b1c[_0x5fc1c4(0x122)],_0x542b1c[_0x5fc1c4(0x17b)]());}),window[_0x363e43(0x12d)](_0x363e43(0x15e),()=>{isPanning=![];}),game['addEventListener'](_0x363e43(0x16a),_0x3207e5=>_0x3207e5[_0x363e43(0x17b)]()),game[_0x363e43(0x12d)](_0x363e43(0x101),_0x5b8750=>{const _0x1bf312=_0x363e43;if(isPanning){const _0x1932b1=_0x5b8750['clientX']-lastMouseX,_0x966162=_0x5b8750[_0x1bf312(0x122)]-lastMouseY;camX-=_0x1932b1/scale,camY-=_0x966162/scale,lastMouseX=_0x5b8750[_0x1bf312(0xef)],lastMouseY=_0x5b8750[_0x1bf312(0x122)],renderAll();}const [_0x2cf48c,_0x4e673f]=screenToWorld(_0x5b8750[_0x1bf312(0xef)],_0x5b8750[_0x1bf312(0x122)]);[hoverCellX,hoverCellY]=snapToGrid(_0x2cf48c,_0x4e673f),updateCoordsDisplay(),renderAll();}),game['addEventListener'](_0x363e43(0xff),_0x3aba62=>{const _0x26ad04=_0x363e43;_0x3aba62['preventDefault']();const _0x5105ca=1.1,[_0x5d4b3a,_0x44c5c7]=screenToWorld(_0x3aba62[_0x26ad04(0xef)],_0x3aba62[_0x26ad04(0x122)]),_0xf5ac49=_0x3aba62['deltaY']<0x0?0x1:-0x1,_0x53d7ad=clamp(scale*(_0xf5ac49>0x0?_0x5105ca:0x1/_0x5105ca),MIN_SCALE,MAX_SCALE);if(_0x53d7ad===scale)return;scale=_0x53d7ad;const _0x1f8b45=game[_0x26ad04(0x160)]();camX=_0x5d4b3a-(_0x3aba62[_0x26ad04(0xef)]-_0x1f8b45[_0x26ad04(0x15b)])/scale,camY=_0x44c5c7-(_0x3aba62[_0x26ad04(0x122)]-_0x1f8b45[_0x26ad04(0x11f)])/scale;const [_0x16a64c,_0x5f2b56]=screenToWorld(_0x3aba62[_0x26ad04(0xef)],_0x3aba62['clientY']);[hoverCellX,hoverCellY]=snapToGrid(_0x16a64c,_0x5f2b56),updateCoordsDisplay(),renderAll();},{'passive':![]});async function placePixelWithHover(){const _0x44a4b4=_0x363e43;if(!auth[_0x44a4b4(0x15a)])return alert('Login\x20to\x20draw!');if(!canPlace)return;canPlace=![];const _0x240586=hoverCellX,_0x5df9fd=hoverCellY,_0x3fc4ed=doc(db,_0x44a4b4(0xe9),_0x240586+'-'+_0x5df9fd);try{if(currentColor===_0x44a4b4(0x172))await deleteDoc(_0x3fc4ed);else await setDoc(_0x3fc4ed,{'x':_0x240586,'y':_0x5df9fd,'color':currentColor});}catch(_0x507398){console[_0x44a4b4(0x149)](_0x507398);}startReload();}function _0x22c9(_0x442ef1,_0x2907ee){const _0xa76ab=_0xa76a();return _0x22c9=function(_0x22c9d9,_0x1495d9){_0x22c9d9=_0x22c9d9-0xe9;let _0x3ea2b2=_0xa76ab[_0x22c9d9];return _0x3ea2b2;},_0x22c9(_0x442ef1,_0x2907ee);}game[_0x363e43(0x12d)](_0x363e43(0x14a),_0x455870=>{if(isPanning||_0x455870['button']!==0x0)return;placePixelWithHover();});if(cursor)cursor[_0x363e43(0x108)]['display']=_0x363e43(0x169);function startReload(){const _0x53b7d9=_0x363e43;let _0x445713=reloadTime;reloadTimerEl[_0x53b7d9(0xf5)]='Reload:\x20'+_0x445713+_0x53b7d9(0x17c);const _0xa2700d=setInterval(()=>{const _0x273f5d=_0x53b7d9;_0x445713--;if(_0x445713<=0x0)clearInterval(_0xa2700d),canPlace=!![],reloadTimerEl[_0x273f5d(0xf5)]=_0x273f5d(0x15d);else reloadTimerEl['innerText']=_0x273f5d(0x10f)+_0x445713+_0x273f5d(0x17c);},0x3e8);}authButton[_0x363e43(0x12d)]('click',async()=>{const _0x11f4f8=_0x363e43;if(auth['currentUser']){await signOut(auth);return;}const _0x371408=prompt(_0x11f4f8(0x13d));if(!_0x371408||_0x371408!=='1'&&_0x371408!=='2')return;const _0x15d614=prompt(_0x11f4f8(0x156)),_0x3fe94c=prompt(_0x11f4f8(0x126));if(!_0x15d614||!_0x3fe94c)return;try{_0x371408==='1'?(await signInWithEmailAndPassword(auth,_0x15d614,_0x3fe94c),alert('Come\x20in!')):(await createUserWithEmailAndPassword(auth,_0x15d614,_0x3fe94c),alert(_0x11f4f8(0x12a)));}catch(_0x4456ff){alert(_0x4456ff['message']);}}),onAuthStateChanged(auth,_0x596b83=>{const _0x347d69=_0x363e43;_0x596b83?(authButton[_0x347d69(0x162)]=_0x347d69(0x141),_0x596b83[_0x347d69(0x157)]===_0x347d69(0x16f)?adminPanel[_0x347d69(0x108)][_0x347d69(0x16d)]='block':adminPanel[_0x347d69(0x108)]['display']='none'):(authButton[_0x347d69(0x162)]=_0x347d69(0x127),adminPanel[_0x347d69(0x108)][_0x347d69(0x16d)]=_0x347d69(0x169));});function parseCoords(){const _0x501b48=_0x363e43;markers=[];const _0x4438f3=coordsInput[_0x501b48(0x152)][_0x501b48(0x159)]();if(!_0x4438f3){renderAll();return;}_0x4438f3[_0x501b48(0x180)](',')[_0x501b48(0xea)](_0x2393af=>{const _0x21a5ec=_0x501b48,[_0x81af6e,_0x5848d0,_0x2442b0,_0x5c6bb6]=_0x2393af[_0x21a5ec(0x159)]()[_0x21a5ec(0x180)](/\s+/),_0x2eb503=parseInt(_0x81af6e),_0xc58065=parseInt(_0x5848d0),_0x5281bb=parseInt(_0x2442b0||'1'),_0x90971a=parseInt(_0x5c6bb6||'1');if(Number[_0x21a5ec(0x117)](_0x2eb503)||Number[_0x21a5ec(0x117)](_0xc58065)||Number['isNaN'](_0x5281bb)||Number[_0x21a5ec(0x117)](_0x90971a))return;const _0x3654e3=_0x2eb503*gridCellSize,_0x541d83=_0xc58065*gridCellSize;for(let _0x4d81dd=0x0;_0x4d81dd<_0x5281bb;_0x4d81dd++){for(let _0x3b9e89=0x0;_0x3b9e89<_0x90971a;_0x3b9e89++){const _0x4f7c6a=_0x3654e3+_0x4d81dd*gridCellSize,_0x5d7e1b=_0x541d83+_0x3b9e89*gridCellSize;_0x4f7c6a>=0x0&&_0x5d7e1b>=0x0&&_0x4f7c6a<=WORLD_W-gridCellSize&&_0x5d7e1b<=WORLD_H-gridCellSize&&markers[_0x21a5ec(0x110)]([_0x4f7c6a,_0x5d7e1b]);}}}),renderAll();}coordsInput[_0x363e43(0x12d)](_0x363e43(0x142),parseCoords);async function adminApplyPixels(_0x4a37a9){const _0x3db8f7=_0x363e43;if(!auth[_0x3db8f7(0x15a)]||auth['currentUser']['email']!==_0x3db8f7(0x16f))return alert(_0x3db8f7(0x12b));parseCoords();let _0x588769=0x0;for(const [_0x1b34ee,_0x413b1d]of markers){const _0x4f6d64=doc(db,_0x3db8f7(0xe9),_0x1b34ee+'-'+_0x413b1d);_0x4a37a9==='add'?(await setDoc(_0x4f6d64,{'x':_0x1b34ee,'y':_0x413b1d,'color':currentColor}),_0x588769++):(await deleteDoc(_0x4f6d64),_0x588769++);}alert((_0x4a37a9==='add'?_0x3db8f7(0xf6):_0x3db8f7(0x17e))+_0x3db8f7(0x136)+_0x588769);}addPixelBtn[_0x363e43(0x12d)](_0x363e43(0x14a),()=>adminApplyPixels(_0x363e43(0x10d))),removePixelBtn['addEventListener']('click',()=>adminApplyPixels('remove')),clearAllPixelsBtn[_0x363e43(0x12d)](_0x363e43(0x14a),async()=>{const _0x807ea7=_0x363e43;if(!auth[_0x807ea7(0x15a)])return alert('Только\x20админ!');const _0x3bee3d=await getDocs(collection(db,_0x807ea7(0xe9)));_0x3bee3d[_0x807ea7(0xea)](_0x4db358=>deleteDoc(_0x4db358[_0x807ea7(0x14d)]));}),banUserBtn[_0x363e43(0x12d)](_0x363e43(0x14a),()=>{const _0x481751=_0x363e43;if(!auth[_0x481751(0x15a)])return alert(_0x481751(0x12b));const _0x2dee38=prompt('Введите\x20UserID\x20для\x20бана:');if(!_0x2dee38)return;const _0x2912b2=ref(rtdb,_0x481751(0x15c)+_0x2dee38);remove(_0x2912b2)[_0x481751(0xfd)](()=>alert(_0x481751(0x119)))['catch'](_0x59e0a1=>console['error'](_0x59e0a1));});import{onDisconnect,set}from'https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js';function trackOnlinePlayer(){const _0x787647=_0x363e43;if(!auth[_0x787647(0x15a)])return;const _0xf44a24=auth[_0x787647(0x15a)][_0x787647(0x163)],_0x2ae203=ref(rtdb,'users/'+_0xf44a24);set(_0x2ae203,{'email':auth[_0x787647(0x15a)]['email'],'lastSeen':Date[_0x787647(0x143)]()}),onDisconnect(_0x2ae203)[_0x787647(0xf7)]();}onAuthStateChanged(auth,_0x371a13=>{_0x371a13&&trackOnlinePlayer();});function updateOnlinePlayers(){const _0x1a0c7d=_0x363e43,_0x6d6cdd=ref(rtdb,_0x1a0c7d(0x15c));onValue(_0x6d6cdd,_0x37c1e6=>{const _0x465c69=_0x1a0c7d,_0x7469ed=_0x37c1e6[_0x465c69(0xf4)](),_0x288f7d=_0x7469ed?Object['keys'](_0x7469ed)['length']:0x0;onlinePlayersEl[_0x465c69(0xf5)]=_0x465c69(0x16e)+_0x288f7d;});}updateOnlinePlayers();
const style = document.createElement("style.abcd123.css");
style.textContent = `
body { 
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  color: #222;
}

h1 {
  color: #ff5a5f;
  text-align: center;
  margin: 10px 0;
}

#game {
  display: block;
  margin: 20px auto;
  width: 1200px;
  height: 600px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  border: 1px solid #ccc;
  background: #fff;
}

#cursor {
  position: absolute;
  box-sizing: border-box;
  width: 10px;
  height: 10px;
  background-color: transparent;
  border: 1px solid #000000;
  pointer-events: none;
}

/* Палитра */
#colorsChoice {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: grid;
  grid-template-columns: repeat(2, 30px); /* Две колонки */
  gap: 6px;
  background: #fff;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  max-height: none; /* убираем ограничение, чтоб всё видно */
}

#colorsChoice div {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #aaa;
  box-sizing: border-box;
}

#colorsChoice div.selected {
  border: 2px solid black;
}

#togglePalette {
  position: fixed;
  right: 20px;
  bottom: -10px; /* чуть ниже палитры */
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

#chat {
  position: fixed;
  right: 1800px;
  bottom: 700px; /* чуть ниже палитры */
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

#reloadTimer {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  font-size: 14px;
  background: rgba(255,255,255,0.8);
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 0 3px rgba(0,0,0,0.2);
}

#adminPanel {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: #fafafa;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
}

#adminPanel input, 
#adminPanel button {
  margin: 4px;
  padding: 4px 8px;
  font-size: 14px;
}

/* Стилизованная тонкая прокрутка */
#colorsChoice::-webkit-scrollbar {
  width: 6px;
}
#colorsChoice::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}
#colorsChoice::-webkit-scrollbar-track {
  background: transparent;
}
document.head.appendChild(style.abcd123.css);
