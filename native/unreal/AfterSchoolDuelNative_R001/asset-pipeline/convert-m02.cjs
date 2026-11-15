const mod='/mnt/disk1/H3_Studio/game-toolchain/node_modules';
const {NodeIO}=require(mod+'/@gltf-transform/core');
const {ALL_EXTENSIONS}=require(mod+'/@gltf-transform/extensions');
const {MeshoptDecoder}=require(mod+'/meshoptimizer');
(async()=>{
 await MeshoptDecoder.ready;
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 const doc=await io.read('/home/master/projects/after-school-duel-r133-shoe-contact-20261114/r45-duel/assets/summons/M02-CafeteriaAunt-ChefHat-Ladle-R114.glb');
 console.log('DECODED_CLIPS',doc.getRoot().listAnimations().map(a=>a.getName()));
 for(const ext of doc.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
 const dst='/mnt/disk1/H3_Studio/game-toolchain/evidence/m01-engine-eval-20261115/M02-CafeteriaAunt-StandardGLB-UNCOMPRESSED.glb';
 await io.write(dst,doc);
 console.log('STANDARD_GLTF_DONE',dst);
})().catch(e=>{console.error(e);process.exitCode=1});
