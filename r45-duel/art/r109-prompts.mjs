/**
 * Art direction for every new card: unique readable visual joke, not reused
 * iconography or palette swaps. All prompts describe ORIGINAL fictional scenes.
 * Visual imagery intentionally contains no text: title and effects are
 * overlaid by the game's accessible HTML/CSS frame.
 */
import {EXTRA_CARDS} from '../cards-r107.mjs';
const SCENES=Object.freeze({
K01:'A school cafeteria wok held triumphantly by a comic middle-aged chef, glossy purple eggplant slices and yellow banana halves tossed together in a sizzling golden spiral, three astonished schoolchildren leaning backwards, absurd culinary magic',
K02:'A melon rind serving as a giant soup cauldron with rubber erasers bouncing out like tiny toy bricks, students hiding behind a translucent green gelatin shield, gleaming tiled school kitchen',
K03:'Juicy green grapes and glowing corn kernels orbiting each other like miniature planets in a wok, chef wearing protective goggles, university food counter',
K04:'A mooncake wearing a stern red chili helmet dramatically bursting out of a sizzling frying pan, playful red fireworks and startled students in campus dining hall',
K05:'A dignified school principal proudly unveiling an apparently empty soup bowl, shimmering imaginary steam shaped like a crown, cafeteria crowd politely applauding and looking confused',
K06:'Gigantic chili bubble tea erupting like a harmless red soda volcano, boba pearls dancing across cafeteria tables, shocked chef clutching straw',
K07:'A giant adorable frog-shaped matcha dessert with tiny royal crown hopping from a cafeteria display, marshmallow cream splashing and students cheering, frog cake is delicious and nonliving fantasy',
K08:'An oversized banana knight in glossy dark chocolate armor holding a wafer shield, whipped cream and tiny biscuit pieces swirling around a cafeteria dessert showcase, adorable heroic expression',
Q01:'A bright pink classroom eraser with tiny arms frantically writing its own apology on a blackboard, chalk dust swirling into a humorous face, pupils giggling',
Q02:'Dozens of cute colorful imaginary mythical school animals reluctantly lining up to enter backpacks under the school gate bell, tiny teacher with attendance clipboard',
Q03:'A sleeping blackboard dreaming of flying mathematical equations rendered as glowing toy planets, teacher floating gently, students awe-struck',
Q04:'A college dorm at night, mischievous smartphone accidentally blasting sound waves from a cluttered desk, six roommates with spectacularly embarrassed theatrical expressions and flying pillows',
Q05:'A piece of chalk with a microphone standing behind a miniature press-conference podium, classroom filled with silly journalists carrying notebook paper',
Q06:'A charming desk lamp with three oversized push-buttons that finally lights on the third click, exhausted inventor student dramatically counting with fingers at study desk',
Q07:'A second small glowing moon squeezing through a school classroom ceiling beside the ordinary moon outside, astronomer teacher dropping chalk in astonishment',
Q08:'A mischievous student sketching a radiant golden chalk circle across a classroom floor, friendly magical barrier rising around mock-panicked exam students and scattered test papers',
S01:'An alarm clock with wings dramatically winding time backwards, student running in reverse towards school gates, scattered autumn leaves flowing upward',
S02:'A ludicrously slender school pencil case crammed with exactly one oversized pencil like a royal sword, shocked students on a maker-club table',
S03:'A large wooden janitor broom lifting a school hallway up through floating air, multiple comic students holding onto backpacks, magical controlled flight',
S04:'Homemade school science machine connected to mismatched exam papers, every red X mark powering luminous coils like a delightful lightning generator, cheerful science club',
S05:'Student-made boxy robot class monitor on a podium addressing a crowd of baffled students, robot projecting a whimsical circuit diagram above its head',
S06:'A glowing quantum rubber band looping across parallel classroom blackboards, one teacher returning before the rubber band, comic time travel motion streaks',
S07:'The afternoon school bell opening a tiny glowing wormhole to Monday, backpacks and calendars spiraling towards a cartoon portal, no dangerous imagery',
S08:'Sentient vending machine angrily debating with a skeptical student, soda cans floating like protest signs, warm school corridor',
P01:'Student on windy campus path with spectacular gravity-defying hair standing straight up like a tree, friends trying to protect notebooks, windy sky, humorous but safe',
P02:'Traditional school wall-game players staring in disbelief at a ball eternally tucked against a stone wall, antique school uniforms, referee asleep with whistle, no clear references to a real school',
P03:'A giant lovable cardboard dinosaur costume sprinting across school sports day field, cardboard scales wobbling, cheering students and ribbon streamers',
P04:'Athletic coach blowing an enormous shining whistle, tiny cartoon wind vortices spinning around a soccer field, runners stopping in comic surprise',
P05:'A volleyball arcs impossibly from one school sports court and drops cleanly through a basketball hoop, shocked athletes, triumphant sparkling trajectory',
P06:'Student on a backwards-running treadmill while the track behind seems to rotate, playful motion streaks and cheering schoolmates',
P07:'A graceful black swan doing a gentle comic ballet glide on a small frozen campus pond, cute observers cheering from safe shore, warm winter sunlight, no injuries',
P08:'A tiny harmless comet glowing like a sports medal drifting into a school athletics field amid confetti, runners standing transfixed',
X01:'Academic clock tower winding one hour backwards while two students stroll backward in whimsical ceremonial robes, floating autumn leaves and time particles',
X02:'A student uniform jacket flying through a classroom wall on its own like a superhero while its owner watches in hilarious surprise',
X03:'A miniature school patrol car magically parked on a grand university rooftop, toy-scale appearance, comic campus security officer staring up',
X04:'A magical nap pillow revealing translucent glimpses of future classroom pop quizzes, student half asleep and alarmed',
X05:'Notebook pages fly out into a pocket galaxy where tiny robots debate exam answers on planet-shaped paper, spectacular colorful space school fantasy',
X06:'Copy machine made from alarm clocks multiplying gentle sunrise rays over four students practicing morning reading in school library',
X07:'The last class of the day disappears like confetti leaving an empty timetable space, teacher enters holding a giant surprise exam paper',
X08:'Friendly time-traveling school gate guard with oversized retro stopwatch sending a late student toward a glowing yesterday calendar portal'
});
const STYLE='Premium original anime movie key art for a collectible campus comedy card game, immaculate character acting and very expressive faces, specific whimsical props, richly textured environment, controlled luminous highlights, polished painterly 3D-anime hybrid, 4:5 portrait, single strong subject and visible reaction characters, dynamic readable composition, no frame or border, no typography, no letters, no words, no logos, no watermarks, not a real brand or real person.';
export const PROMPT_BATCH=Object.freeze(EXTRA_CARDS.map((c,i)=>({
 id:c.id,name:c.name,theme:c.theme,
 seed:130911+i*7919,
 prompt:STYLE+' Scene: '+SCENES[c.id]+'.',
 filename:c.id+'.webp'
})));
if(Object.keys(SCENES).length!==40||PROMPT_BATCH.length!==40||
 new Set(PROMPT_BATCH.map(x=>x.id)).size!==40)
 throw Error('R109 independent scene brief must cover 40 unique cards');
