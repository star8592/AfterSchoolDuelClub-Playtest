import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
try{
 const p=await b.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:10976/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded'});
 await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:70000});
 const rect=await p.frameLocator('#stadium').locator('canvas').boundingBox();
 const x=rect.x+rect.width*.45,y=rect.y+rect.height*.48;
 await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+220,y,{steps:18});await p.mouse.up();
 await p.waitForTimeout(900);
 const drag=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
 await p.locator('#camera-reset').click();
 await p.waitForTimeout(900);
 const reset=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
 const passed=Math.abs(drag.yaw)>40&&Math.abs(reset.yaw)<1&&!errors.length;
 console.log('R48_POINTER_GATE',JSON.stringify({passed,drag:drag.yaw,reset:reset.yaw,errors}));
 if(!passed)process.exitCode=3;
}finally{await b.close()}
