;(function(){
"use strict";
var modes=[
  {id:"story",label:"Story seed"},
  {id:"scene",label:"Scene drill"},
  {id:"character",label:"Character pressure"},
  {id:"opening",label:"Opening drill"}
];
var genres=["Any","Fantasy","Science fiction","Mystery","Romance","Horror","Literary","Adventure"];
var moods=["Any","Cozy","Tense","Strange","Melancholy","Hopeful","Funny","Dark"];
var P={
character:[
"a meticulous archivist who lies about one small thing every day",
"a courier who remembers every door they have ever opened",
"a retired prodigy afraid their best work is behind them",
"a night-shift worker who keeps finding evidence of a second life",
"a charming failure accidentally trusted with something precious",
"a patient caretaker with one spectacularly selfish wish",
"a local celebrity who desperately wants to become anonymous",
"a skeptic who is the only witness to something impossible",
"a person who spent ten years preparing for the wrong crisis",
"a reluctant expert called back to the place they swore off",
"an apprentice who mastered the rules and misunderstood the point",
"a new teacher who can read a room but not the people they love"
],
want:[
"wants to be forgiven without admitting exactly what happened",
"needs to retrieve something they once gave away freely",
"is trying to protect a routine that is already falling apart",
"wants one honest conversation before sunrise",
"needs to win the trust of someone who has every reason to refuse",
"is determined to prove a long-dismissed theory is true",
"wants to leave town without anyone noticing",
"needs to keep a promise that has become dangerous",
"is trying to make one perfect thing before time runs out",
"wants to undo a choice everyone else considers settled",
"needs to find the person who knows why the story does not add up",
"wants a second chance but only on their own terms"
],
setting:[
"a nearly empty hotel during an off-season storm",
"a public library ten minutes before closing",
"a crowded night market where one stall never appears twice",
"a ferry stopped halfway across the water",
"a tiny apartment above a business that never seems to close",
"a museum during a private event no one remembers booking",
"a quiet neighborhood on the hottest night of the year",
"a train platform after the final departure",
"a family kitchen while a celebration happens in the next room",
"a remote clinic with one unexpected patient",
"an old theater during dress rehearsal",
"a roadside diner just before dawn"
],
obstacle:[
"the person who can help wants the exact opposite outcome",
"a harmless lie has become the foundation of everyone else's plan",
"the obvious solution would expose someone innocent",
"they only have one attempt and no way to rehearse it",
"a trusted ally is withholding one essential fact",
"the deadline is much sooner than anyone realizes",
"the evidence points toward the person they most want to protect",
"solving the immediate problem will create a larger one",
"they must ask for help from someone they publicly humiliated",
"the rules are clear, fair, and disastrous for them",
"the one resource they counted on is suddenly unavailable",
"they misunderstood what success would cost"
],
twist:[
"The apparent antagonist is trying to prevent a worse outcome.",
"The missing thing was never stolen; it was deliberately returned.",
"A witness tells the truth for reasons that make the truth harder to use.",
"The protagonist gets exactly what they wanted halfway through.",
"Someone recognizes the protagonist under a name they have never used.",
"The safest choice becomes impossible without betraying a private promise.",
"A decorative detail turns out to be a deliberate warning.",
"The person with the least power has been steering the situation.",
"The deadline is real, but everyone misunderstood what happens at zero.",
"An apology arrives from the wrong person.",
"The solution requires repeating a mistake they swore never to make again.",
"The strongest assumption is technically correct and still misleading."
],
craft:[
"Write 500 words without explaining anyone's emotion directly.",
"Keep the scene under 700 words and end on a concrete action, not a thought.",
"Let every line of dialogue contain a second, unspoken objective.",
"Use no backstory until after the first irreversible choice.",
"Write in close point of view and never name the central fear.",
"Include one sentence under four words and one over thirty-five.",
"Start late and leave early: enter after the argument begins.",
"Make the most important information arrive through interruption.",
"Give the protagonist three chances to tell the truth.",
"Do not use felt, realized, suddenly, or just.",
"Let an object change hands at least twice.",
"Make the final image answer the opening image without repeating it."
],
opening:[
"By the time the kettle screamed, everyone in the apartment had agreed not to mention the suitcase.",
"The first lie of the morning was so small nobody bothered to challenge it.",
"There were three names on the envelope, and one belonged to a dead person.",
"At 2:17 a.m., the elevator opened on a floor the building did not have.",
"She knew the apology was sincere because it arrived six years too late.",
"The dog came home wearing somebody else's collar.",
"No one noticed the missing chair until the meeting was already over.",
"He had practiced being surprised; he had not practiced relief.",
"The town's only locksmith found the key inside his own front door.",
"The message said DO NOT COME ALONE, which would have helped if she had been alone.",
"On the last ordinary Tuesday of his life, Theo bought two pears and forgot both.",
"The problem with inheriting a secret is that nobody tells you when it starts accruing interest."
],
objective:[
"get a signature before the other person reads the final page",
"leave the room with the same secret they entered with",
"convince someone to stay for ten more minutes",
"retrieve a small object without revealing why it matters",
"make an accusation sound like a favor",
"learn who sent the message without asking directly",
"win permission to enter somewhere they do not belong",
"stop a celebration without explaining the reason",
"exchange one item for another while pretending the trade is casual",
"force an honest answer before a third person arrives",
"hide evidence in plain sight",
"make somebody laugh at exactly the wrong moment"
],
reversal:[
"Halfway through, the person being pressured gains the leverage.",
"The requested favor is granted immediately, creating the real problem.",
"A private conversation becomes public without either character noticing.",
"The protagonist learns their objective was already completed by someone else.",
"The person who seemed trapped reveals they arranged the meeting.",
"A small physical accident forces both characters to drop the performance.",
"The scene's most confident claim is disproven by something mundane.",
"An unexpected kindness makes the planned confrontation harder.",
"The protagonist is offered a better deal than the one they came to demand.",
"A third person arrives and sides with the least likely character.",
"The object everyone is arguing about breaks.",
"Leaving becomes more dangerous than staying."
],
sensory:[
"Use smell as the scene's strongest sensory channel.",
"Avoid color words; make texture carry the description.",
"Let background sound change meaning three times.",
"Include one ordinary object that becomes uncomfortable to hold.",
"Make temperature track the emotional power shift.",
"Describe the setting through what the character refuses to look at.",
"Use one recurring sound as a countdown.",
"Give the scene one vivid taste that does not belong there.",
"Let distance and proximity do more work than adjectives.",
"Use light only through reflections and shadows.",
"Give each character a different relationship to the same smell.",
"Use the floor underfoot to reveal a change in control."
],
dialogue:[
"“You keep saying that as if it happened to both of us.”",
"“I can explain the key. I cannot explain why you have it.”",
"“If this is your version of good news, start over.”",
"“You asked me for honesty, not usefulness.”",
"“I believed you. That is not the same as agreeing with you.”",
"“Before you open that, decide which answer you can live with.”",
"“We are not having the same argument, and yours is easier.”",
"“I came to apologize, but apparently I am early.”",
"“Nobody is accusing you. I am asking why you sound accused.”",
"“You were right about the danger and wrong about where it was.”",
"“Tell me the version you planned to tell the police.”",
"“I did exactly what you asked. That is the problem.”"
],
contradiction:[
"is generous with money and miserly with attention",
"hates uncertainty but makes a living creating it",
"is brutally honest with strangers and evasive with family",
"is famous for courage and privately afraid of being needed",
"can forgive betrayal but not embarrassment",
"loves rules because breaking them feels more meaningful",
"is deeply observant and consistently misreads kindness",
"wants intimacy but turns every confession into a joke",
"is patient in emergencies and impossible during ordinary delays",
"believes everyone deserves a second chance except themselves",
"is skilled at negotiation and terrible at asking plainly",
"protects other people's privacy while constantly invading their own memories"
],
secret:[
"they caused the problem they are volunteering to solve",
"they already saw the object everyone is searching for",
"they are using a borrowed identity for an innocent reason that stopped being innocent",
"they received the warning days ago and ignored it",
"they know the victim and are pretending not to",
"they have been rehearsing this conversation for years",
"they promised two people mutually impossible things",
"they are less certain of their expertise than everyone assumes",
"they secretly hope the plan fails",
"they have one piece of evidence they refuse to share",
"the person they blame once saved their life",
"they already made the choice the scene appears to be building toward"
],
relationship:[
"an old friend who knows exactly where the protagonist becomes dishonest",
"a sibling who stopped asking for explanations",
"a rival whose criticism is irritatingly accurate",
"a stranger who behaves as though they have already met",
"a former mentor who now needs help from their student",
"a child who notices the one thing every adult ignores",
"an ex who is being kinder than the situation deserves",
"a neighbor whose small favor becomes impossible to repay",
"a colleague who mistakes competence for loyalty",
"a parent who remembers events very differently",
"a temporary ally with permanent leverage",
"a person the protagonist once rescued who never wanted rescuing"
],
tell:[
"When cornered, they become excessively polite.",
"They straighten objects that are not theirs.",
"They answer difficult questions with exact times and dates.",
"They laugh once, very quietly, before lying.",
"They stop using contractions when angry.",
"They touch the base of their thumb when they want to leave.",
"They compliment people immediately before disagreeing.",
"They count exits without realizing it.",
"They remove their watch before making a risky decision.",
"They repeat the last word of a question when buying time.",
"They notice shoes before faces.",
"They apologize to objects they bump into, never to people."
],
image:[
"a perfectly set table with one place setting facing the wall",
"a row of wet footprints beginning in the middle of a dry room",
"a birthday cake with every candle already burned down",
"a commuter train carrying one passenger in every car",
"a wedding dress hanging in a laundromat at midnight",
"a child's drawing pinned inside a locked office",
"a garden sprinkler running during heavy rain",
"a stack of unopened letters arranged by color instead of date",
"a motel sign missing exactly one letter",
"a glass of water trembling on an otherwise still table",
"an expensive coat folded beside a public trash can",
"a phone ringing inside a sealed display case"
],
disruption:[
"Someone arrives to return something the protagonist never loaned out.",
"A routine transaction reveals the protagonist is listed under the wrong name.",
"A stranger quotes a sentence from the protagonist's private journal.",
"The power goes out in every building except one.",
"A scheduled announcement names the wrong person.",
"The protagonist receives proof that tomorrow has already happened once.",
"A familiar person behaves as though this is their first meeting.",
"An object that should be unique appears in duplicate.",
"A harmless bureaucratic error exposes a dangerous relationship.",
"The protagonist gets a voicemail recorded in their own voice.",
"A celebration begins one day too early and nobody explains why.",
"The thing everyone has been waiting for arrives empty."
],
question:[
"What does the protagonist know that makes the opening image frightening?",
"Who benefits if the protagonist misunderstands what they are seeing?",
"What promise is already being broken on page one?",
"What ordinary explanation would be almost comforting?",
"Who is missing, and why does everyone avoid saying their name?",
"What does the protagonist want to leave before anyone notices?",
"Which detail will mean something different by the end of the chapter?",
"What happened here once before?",
"Why is the protagonist pretending this is normal?",
"What would force them to stay when every instinct says leave?",
"What should the reader suspect before the protagonist does?",
"What is the first irreversible action?"
]
};
var G={
Fantasy:{setting:["a shrine where prayers are traded like debts","a city built inside the ribs of a dead giant","a border village where magic works only after sunset"],obstacle:["an old oath has literal force and applies to the wrong person","the spell succeeds but recognizes someone else as its owner","a local custom makes the truthful answer legally dangerous"],twist:["The legendary object is authentic and useless for the task everyone expects.","The monster remembers being human and has witnesses.","The prophecy was written as a warning, not a promise."]},
"Science fiction":{setting:["a station ring scheduled for deorbit","a colony where every resident receives the same dream update","a research vessel carrying one more life-sign than passengers"],obstacle:["the system is behaving exactly as designed","the backup contains a decision nobody remembers making","the only person with clearance is legally dead"],twist:["The malfunction is a successful safety protocol.","The alien signal is responding to something humans did not know they broadcast.","The copy remembers an event the original does not."]},
Mystery:{setting:["a locked archive after a donor gala","a coastal town during an annual blackout drill","a courthouse records room during a fire alarm"],obstacle:["every witness is telling a different part of the same truth","the timeline works only if one clock is trusted","the strongest evidence was planted by someone trying to help"],twist:["The alibi is genuine and evidence of a different crime.","The victim arranged the clue trail for someone else.","The missing person knows there was no crime at the beginning."]},
Romance:{setting:["a conference where both leads pretend not to know each other","a neighborhood fundraiser neither person wanted to attend","a delayed overnight train with one working dining car"],obstacle:["honesty would solve the practical problem and destroy the emotional truce","one person is leaving sooner than the other knows","they want the same future but disagree about its cost"],twist:["The grand gesture is refused for the right reason.","The misunderstanding clears early, exposing the real incompatibility.","The rival is sincerely trying to help both of them."]},
Horror:{setting:["a care facility where every clock loses the same seven minutes","a rental house whose spare room is warmer than the rest","a forest cabin with a guestbook written in one handwriting"],obstacle:["the safest rule requires someone to stay behind","the threat appears only in records made afterward","the protagonist must behave normally to avoid being noticed"],twist:["The protective ritual is actually an invitation.","The haunting is trying to keep people out of one room.","The protagonist survived this once but remembers it as a dream."]},
Literary:{setting:["a family home being emptied after decades of deferred decisions","a reunion held in a town everyone describes differently","a quiet workplace on the day its closure becomes official"],obstacle:["everyone agrees on what happened but not what it meant","repairing the relationship requires surrendering a cherished self-story","the practical decision is easy; the symbolic one is not"],twist:["The long-awaited confession changes nothing practical.","The person blamed for leaving was the only one who stayed in the way that mattered.","The heirloom matters because everyone misremembers where it came from."]},
Adventure:{setting:["a mountain pass closing ahead of an unnatural storm","a flooded ruin reachable for one hour at low tide","a cargo plane forced down far from its filed route"],obstacle:["the map is accurate but no longer describes the landscape","the fastest route belongs to someone demanding payment in a promise","the team can carry the person or the evidence, not both"],twist:["The destination is a decoy protecting what lies on the route.","The rival expedition arrived first and now needs rescue.","The treasure is information that becomes dangerous when known."]}
};
var moodLines={
Cozy:["Keep the stakes intimate even if the problem is strange.","Let competence, ritual, or hospitality provide some of the pleasure."],
Tense:["Make every useful answer create a new clock.","Let pauses and withheld information tighten the scene."],
Strange:["Include one impossible detail nobody comments on.","Make the familiar slightly wrong before anything is openly impossible."],
Melancholy:["Let the character gain something that makes an old loss sharper.","Use one ordinary object as a quiet carrier of memory."],
Hopeful:["Make the difficult choice create an opening rather than a perfect solution.","Let someone risk kindness before they know it will be returned."],
Funny:["Give the serious objective an inconveniently specific obstacle.","Let characters protect their dignity long after dignity has left the room."],
Dark:["Make the easiest solution morally expensive.","Let success reveal a cost the character cannot unknow."]
};
var M={
story:[["character","Protagonist"],["want","Drive"],["setting","Place"],["obstacle","Pressure"],["twist","Turn"],["craft","Craft rule"],["opening","Opening line"]],
scene:[["character","POV character"],["objective","Scene objective"],["setting","Stage"],["obstacle","Resistance"],["reversal","Reversal"],["sensory","Sensory rule"],["dialogue","Line to earn"]],
character:[["character","Character"],["contradiction","Contradiction"],["secret","Secret"],["relationship","Pressure point"],["obstacle","Immediate problem"],["tell","Behavioral tell"],["dialogue","Line to earn"]],
opening:[["image","Opening image"],["character","POV character"],["disruption","Disruption"],["question","Reader question"],["obstacle","Immediate pressure"],["craft","Craft rule"],["opening","First line"]]
};
function rnd(n){if(globalThis.crypto&&crypto.getRandomValues){var a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}return Math.floor(Math.random()*n)}
function pick(a){return a[rnd(a.length)]}
function pool(k,g){var a=(P[k]||[]).slice(),x=g&&g!=="Any"&&G[g]&&G[g][k];return x?x.concat(a):a}
function state(x){x=x&&typeof x==="object"?x:{};return{mode:M[x.mode]?x.mode:"story",genre:genres.indexOf(x.genre)>=0?x.genre:"Any",mood:moods.indexOf(x.mood)>=0?x.mood:"Any",current:x.current&&typeof x.current==="object"?x.current:null,locks:x.locks&&typeof x.locks==="object"?x.locks:{},saved:Array.isArray(x.saved)?x.saved:[],pinned:x.pinned&&typeof x.pinned==="object"?x.pinned:null}}
function brief(f,v){var lead=f.genre&&f.genre!=="Any"?f.genre+": ":"",ml=f.mood&&f.mood!=="Any"?" "+pick(moodLines[f.mood]||[]):"";if(f.mode==="scene")return lead+"Write a scene about "+v.character+", who must "+v.objective+" in "+v.setting+". "+v.obstacle+" "+v.reversal+ml;if(f.mode==="character")return lead+"Build a scene around "+v.character+", who "+v.contradiction+". Their secret: "+v.secret+". Put them opposite "+v.relationship+", then force the issue: "+v.obstacle+ml;if(f.mode==="opening")return lead+"Open on "+v.image+". Center "+v.character+". Then: "+v.disruption+" Keep this question alive: "+v.question+ml;return lead+"Follow "+v.character+", who "+v.want+", into "+v.setting+". "+v.obstacle+" Then turn the screw: "+v.twist+ml}
function generate(f,fresh){f=state(f);var slots=M[f.mode],old=f.current&&f.current.mode===f.mode?f.current.values||{}:{},v={};for(var i=0;i<slots.length;i++){var k=slots[i][0];v[k]=!fresh&&f.locks[k]&&old[k]?old[k]:pick(pool(k,f.genre))}f.current={id:(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random()),createdAt:new Date().toISOString(),mode:f.mode,genre:f.genre,mood:f.mood,title:{story:"A story is hiding in here.",scene:"Put two wants in one room.",character:"Make a person difficult to simplify.",opening:"Open a door the reader wants to walk through."}[f.mode],values:v,brief:brief(f,v)};return f}
function text(i){if(!i)return"";var labels=Object.fromEntries(M[i.mode]||M.story),d=Object.keys(i.values||{}).map(function(k){return(labels[k]||k)+": "+i.values[k]}).join("\n");return i.title+"\n\n"+i.brief+"\n\n"+d}
window.WEBNEO_FORGE={modes:modes,genres:genres,moods:moods,slots:function(m){return(M[m]||M.story).map(function(x){return{key:x[0],label:x[1]}})},createState:state,generate:generate,asText:text};
})();