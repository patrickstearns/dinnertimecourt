/** Card definitions for Dinnertime Court */

const INGREDIENTS = [
  { id: 'brockolli', name: 'Brockolli', type: 'ingredient', image: '/assets/ingredients/brockolli.png', flavor: 'Sweet and good for you, but not so much your teeth.' },
  { id: 'carroot', name: 'Carroot', type: 'ingredient', image: '/assets/ingredients/carroot.png', flavor: 'A little spicy, and supposedly good for your night vision.' },
  { id: 'potatoe', name: 'Potatoe', type: 'ingredient', image: '/assets/ingredients/potatoe.png', flavor: 'Root vegetables; a bit bland but good if you pick out all the nails.' },
  { id: 'termater', name: 'Termater', type: 'ingredient', image: '/assets/ingredients/termater.png', flavor: 'Vegetable or insect? Either way, it tasted good.' },
  { id: 'hweetgrains', name: 'Hweetgrains', type: 'ingredient', image: '/assets/ingredients/hweetgrains.png', flavor: 'Hwolesome and filling.' },
  { id: 'dillyweed', name: 'Dillyweed', type: 'ingredient', image: '/assets/ingredients/dillyweed.png', flavor: 'The kind you make pickles with, not...the other thing.' },
  { id: 'rosemarie', name: 'Rosemarie', type: 'ingredient', image: '/assets/ingredients/rosemarie.png', flavor: "It's like rosemary, but fancier." },
  { id: 'gahlic', name: 'Gahlic', type: 'ingredient', image: '/assets/ingredients/gahlic.png', flavor: 'Is it a spice or a vegetable? Who cares, mash it with butter and give it to me on toast.' },
  { id: 'punkin', name: 'Punkin', type: 'ingredient', image: '/assets/ingredients/punkin.png', flavor: 'A vine fruit that will smash the system.' },
  { id: 'cheez', name: 'Cheez', type: 'ingredient', image: '/assets/ingredients/cheez.png', flavor: "A cultured Mil'q product." },
  { id: 'milk', name: 'Milk', type: 'ingredient', image: '/assets/ingredients/milk.png', flavor: "Sure, sure, lactic gland secretions, but...from what?" },
  { id: 'eggz', name: "B'cock Eggz", type: 'ingredient', image: '/assets/ingredients/eggz.png', flavor: "Mostly clean, guaranteed b'cock!" },
  { id: 'hoark', name: 'Hoark Chop', type: 'ingredient', image: '/assets/ingredients/hoark.png', flavor: 'A chop of hoark pork, the bestest there izzes!' },
  { id: 'mutton', name: 'Mutton', type: 'ingredient', image: '/assets/ingredients/mutton.png', flavor: "Because they're tastier when you kill them as babies. Mmm. Babies." },
  { id: 'tofurkey', name: 'Tofurkey', type: 'ingredient', image: '/assets/ingredients/tofurkey.png', flavor: "I hear it's a hybrid, but I don't want to know how they made it." },
  { id: 'bcock', name: "B'cock Meat", type: 'ingredient', image: '/assets/ingredients/bcock.png', flavor: "Fry it, bake it, steam it, roast it - there's no wrong way to enjoy b'cock!" },
  { id: 'grouncow', name: "Groun'cow", type: 'ingredient', image: '/assets/ingredients/grouncow.png', flavor: "It wuz a cow. Now it's groun'. How now? Groun' cow." },
];

/** effect: applied when Food token is used in court.
 *  25 recipes: 8×2-ing, 8×3-ing, 8×4-ing, 1×5-ing.
 *  Each of 17 ingredients appears 4–5 times (77 slots total).
 */
const RECIPES = [
  // ——— 2 ingredients (8) ———
  {
    id: 'rock_candy_crunch',
    name: 'Rock Candy Crunch',
    type: 'recipe',
    ingredients: ['brockolli', 'carroot'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Crunchy, sticky, and oddly persuasive.',
    judgeDialogue: 'Rock Candy Crunch? This rocks the bench—sweet justice never crunched so good!',
  },
  {
    id: 'skillet_taters',
    name: 'Skillet Taters',
    type: 'recipe',
    ingredients: ['potatoe', 'termater'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Taters and termaters, nailed to the pan.',
    judgeDialogue: 'Skillet Taters? I find them a-peeling—case dismissed from my plate!',
  },
  {
    id: 'dill_grain_bites',
    name: 'Dill Grain Bites',
    type: 'recipe',
    ingredients: ['hweetgrains', 'dillyweed'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Wholesome grains with ambitious dill.',
    judgeDialogue: 'Dill-lightful! These grain bites rule in my favor—whole-some verdict!',
  },
  {
    id: 'herb_garlic_toast',
    name: 'Herb Garlic Toast',
    type: 'recipe',
    ingredients: ['rosemarie', 'gahlic'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Rosemarie insists on being toasted properly.',
    judgeDialogue: 'Herb your enthusiasm, crown, I must toast this delicious toast!',
  },
  {
    id: 'punkin_cheez_melts',
    name: 'Punkin Cheez Melts',
    type: 'recipe',
    ingredients: ['punkin', 'cheez'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Mohawk pumpkin meets legally distinct cheese.',
    judgeDialogue: 'Oh my gourd—Punkin Cheez Melts really squash my objections!',
  },
  {
    id: 'mystery_scramble',
    name: 'Mystery Scramble',
    type: 'recipe',
    ingredients: ['milk', 'eggz'],
    effect: { kind: 'self', amount: 2 },
    flavor: "Don't ask what's in the milk.",
    judgeDialogue: 'Eggs-actly what this court needed! Mystery solved: it\'s delicious.',
  },
  {
    id: 'double_chop_skillet',
    name: 'Double Chop Skillet',
    type: 'recipe',
    ingredients: ['hoark', 'mutton'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Hoark and mutton share a skillet. Mutton objects.',
    judgeDialogue: 'Double Chop Skillet? That\'s a cut above contempt—I\'ll skillet down for seconds!',
  },
  {
    id: 'bird_beast_bites',
    name: 'Bird & Beast Bites',
    type: 'recipe',
    ingredients: ['tofurkey', 'bcock'],
    effect: { kind: 'self', amount: 2 },
    flavor: 'Tofu beast meets whole B\'cock. Both lose.',
    judgeDialogue: 'Bird & Beast Bites? Fowl play never tasted so fair—beastly good, counselor!',
  },

  // ——— 3 ingredients (8) ———
  {
    id: 'pantry_hash',
    name: 'Pantry Hash',
    type: 'recipe',
    ingredients: ['brockolli', 'potatoe', 'hweetgrains'],
    effect: { kind: 'self', amount: 3 },
    flavor: 'Autumn on a skillet.',
    judgeDialogue: 'Pantry Hash? You\'ve hashed out a flavor I can stanza behind!',
  },
  {
    id: 'punkin_herb_soup',
    name: 'Punkin Herb Soup',
    type: 'recipe',
    ingredients: ['rosemarie', 'punkin', 'milk'],
    effect: { kind: 'self', amount: 3 },
    flavor: 'Marie-approved pumpkin comfort.',
    judgeDialogue: 'Soup-reme Court approves! No gourd objections from this bench.',
  },
  {
    id: 'meat_greens_skillet',
    name: 'Meat & Greens Skillet',
    type: 'recipe',
    ingredients: ['hoark', 'tofurkey', 'brockolli'],
    effect: { kind: 'self', amount: 3 },
    flavor: 'Protein and produce in uneasy alliance.',
    judgeDialogue: 'Meat & Greens Skillet? Meat me in the middle—this sizzles!',
  },
  {
    id: 'herb_grain_mash',
    name: 'Herb Grain Mash',
    type: 'recipe',
    ingredients: ['potatoe', 'hweetgrains', 'rosemarie'],
    effect: { kind: 'self', amount: 3 },
    flavor: 'Breakfast that files its own motions.',
    judgeDialogue: 'Herb Grain Mash? Mashed my expectations—herb today\'s special: more!',
  },
  {
    id: 'punkin_chop_stew',
    name: 'Punkin Chop Stew',
    type: 'recipe',
    ingredients: ['punkin', 'milk', 'hoark'],
    effect: { kind: 'self', amount: 5 },
    flavor: 'Mohawk optional. Seasoning mandatory.',
    judgeDialogue: 'Punkin Chop Stew? Stew-pendous! That chop stewed its way to my heart.',
  },
  {
    id: 'garden_bird_roast',
    name: 'Garden Bird Roast',
    type: 'recipe',
    ingredients: ['tofurkey', 'brockolli', 'punkin'],
    effect: { kind: 'self', amount: 3 },
    flavor: 'Rolled up and ready for closing arguments.',
    judgeDialogue: 'Garden Bird Roast? Roast verdict: innocent of being anything but delicious!',
  },
  {
    id: 'herb_bird_bowl',
    name: 'Herb Bird Bowl',
    type: 'recipe',
    ingredients: ['hweetgrains', 'rosemarie', 'tofurkey'],
    effect: { kind: 'self', amount: 3 },
    flavor: 'Grain, herb, and politely defeated tofu.',
    judgeDialogue: 'Herb Bird Bowl? Bowl me over—that\'s the word, bird!',
  },
  {
    id: 'cream_bisque',
    name: 'Cream Bisque',
    type: 'recipe',
    ingredients: ['milk', 'hoark', 'potatoe'],
    effect: { kind: 'self', amount: 4 },
    flavor: 'Cancels hunger. Scandalously filling.',
    judgeDialogue: 'Cream Bisque? A bisque ask, but I soup-port this—the cream of the crop!',
  },

  // ——— 4 ingredients (8) ———
  {
    id: 'pastoral_chili',
    name: 'Pastoral Chili',
    type: 'recipe',
    ingredients: ['grouncow', 'carroot', 'termater', 'dillyweed'],
    effect: { kind: 'raise_stakes', prestige: 1, difficulty: 2 },
    flavor: 'Hot enough to raise the stakes — and the heat.',
    judgeDialogue: 'Pastoral Chili? Chili today, hot tamale—I mean, judicially speaking, divine!',
  },
  {
    id: 'mixed_beast_chili',
    name: 'Mixed Beast Chili',
    type: 'recipe',
    ingredients: ['grouncow', 'termater', 'dillyweed', 'gahlic'],
    effect: { kind: 'self', amount: 7 },
    flavor: 'Everyone contributed. Nobody admits it.',
    judgeDialogue: 'Mixed Beast Chili? I\'m raising the steaks—the heat is in order!',
  },
  {
    id: 'grouncow_cheez_boat',
    name: "Groun'cow Cheez Boat",
    type: 'recipe',
    ingredients: ['grouncow', 'dillyweed', 'gahlic', 'cheez'],
    effect: { kind: 'self', amount: 6 },
    flavor: 'A vessel of dairy and destiny.',
    judgeDialogue: "Ahoy! That Groun'cow Cheez Boat floats my bench—full steam ahead!",
  },
  {
    id: 'grouncow_breakfast_skillet',
    name: "Groun'cow Breakfast Skillet",
    type: 'recipe',
    ingredients: ['grouncow', 'gahlic', 'cheez', 'eggz'],
    effect: { kind: 'self', amount: 5 },
    flavor: 'Loud garlic. Quiet eggs. Loud results.',
    judgeDialogue: "Groun'cow Breakfast Skillet? Breakfast of bench-men—over-easy on objections!",
  },
  {
    id: 'royal_bird_quiche',
    name: 'Royal Bird Quiche',
    type: 'recipe',
    ingredients: ['cheez', 'eggz', 'mutton', 'bcock'],
    effect: { kind: 'self', amount: 10 },
    flavor: 'A quiche with commitment issues and a crust.',
    judgeDialogue: 'Royal Bird Quiche? Quiche me? Your Honor is royally egg-static!',
  },
  {
    id: 'inferno_clubette',
    name: 'Inferno Clubette',
    type: 'recipe',
    ingredients: ['eggz', 'mutton', 'bcock', 'carroot'],
    effect: { kind: 'swap_scores' },
    flavor: 'Swaps your score with the case difficulty mid-bite.',
    judgeDialogue: 'Inferno Clubette? Spicy! You\'ve fired up my appetite—and melted my gavel!',
  },
  {
    id: 'triple_meatpie',
    name: 'Triple Meatpie',
    type: 'recipe',
    ingredients: ['mutton', 'bcock', 'carroot', 'termater'],
    effect: { kind: 'self', amount: 6 },
    flavor: 'Three meats. One crust. Zero mercy.',
    judgeDialogue: 'Triple Meatpie? Three meats, one pie, zero objections—pie\'ll allow it!',
  },
  {
    id: 'spicy_bird_wrap',
    name: 'Spicy Bird Wrap',
    type: 'recipe',
    ingredients: ['bcock', 'carroot', 'termater', 'dillyweed'],
    effect: { kind: 'self', amount: 6 },
    flavor: 'Hot enough to win closing arguments.',
    judgeDialogue: 'Mmm, that about wraps up this case.',
  },

  // ——— 5 ingredients (1) ———
  {
    id: 'grand_court_casserole',
    name: 'Grand Court Casserole',
    type: 'recipe',
    ingredients: ['grouncow', 'cheez', 'eggz', 'mutton', 'gahlic'],
    effect: { kind: 'self', amount: 10 },
    flavor: 'The crown jewel of halfling jurisprudence.',
    judgeDialogue: 'Grand Court Casserole? Cass-ALL-yes! Court recessed—for seconds!',
  },
];

for (const recipe of RECIPES) {
  recipe.image = `/assets/food/${recipe.id}.png`;
}

const ARGUMENTS = [
  {
    id: 'look_criminal',
    name: 'Does He Look Like a Criminal?',
    type: 'argument',
    effect: { kind: 'self', amount: 3 },
    flavor: 'Gesture vaguely at the accused.',
    dialogue: 'Your honor — does my client look like a criminal to you?',
  },
  {
    id: 'plead_fifth',
    name: 'Plead for a Fifth',
    type: 'argument',
    effect: { kind: 'ease_case', difficulty: 4, prestige: 2 },
    flavor: 'Take the fifth: much easier case, but far less Prestige.',
    dialogue: "Your Honor, I'm not nearly drunk enough for this yet.",
  },
  {
    id: 'nuh_uh',
    name: 'Nuh-Uh',
    type: 'argument',
    effect: { kind: 'self_and_raise_stakes', amount: 3, gp: 3, difficulty: 1 },
    flavor: 'Deny everything — and pad the GP purse for the trouble.',
    dialogue: 'Nuh-uh! Absolutely, categorically nuh-uh!',
  },
  {
    id: 'profiled',
    name: 'My Client Was Profiled',
    type: 'argument',
    effect: { kind: 'self', amount: 5 },
    flavor: 'They only stopped him because he was three feet tall.',
    dialogue: 'My client was profiled — they stopped him for being three feet tall!',
  },
  {
    id: 'chewbacca',
    name: 'Chewbacca Defense',
    type: 'argument',
    effect: { kind: 'self', amount: 10 },
    flavor: "It does not make sense. That's the point.",
    dialogue: 'If Chewbacca lives on Endor, you must acquit!',
  },
  {
    id: 'overruled',
    name: 'Objection Overruled (By Me)',
    type: 'argument',
    effect: { kind: 'self', amount: 4 },
    flavor: 'Confidence is 90% of the law.',
    dialogue: 'Overruled? I over your rule! Overrule overruled! By me!',
  },
  {
    id: 'cookie_defense',
    name: 'The Cookie Made Me Do It',
    type: 'argument',
    effect: { kind: 'self_if_food', withFood: 5, withoutFood: 2 },
    flavor: 'Stronger if you still have a snack on the table.',
    dialogue: '...and in closing, Your Honor, I think any of us might have done the same.',
  },
  {
    id: 'continuance',
    name: 'Continuance Please',
    type: 'argument',
    effect: { kind: 'ease_case', difficulty: 3, prestige: 1 },
    flavor: 'Buy time: much easier case, but less Prestige on the win.',
    dialogue: 'Your honor, defense requests a continuance while we work on our bri...uh, quiche.',
  },
  {
    id: 'bite_marks',
    name: 'Exhibit A: Bite Marks',
    type: 'argument',
    effect: { kind: 'spend_prestige', prestigeCost: 1, amount: 5 },
    flavor: 'Spend 1 Prestige for a devastating snack-based exhibit.',
    dialogue: 'Exhibit A, your honor: bite marks. Clearly not my client’s teeth.',
  },
  {
    id: 'hearsay',
    name: 'Hearsay Schmearsay',
    type: 'argument',
    effect: { kind: 'self', amount: 3 },
    flavor: 'If nobody heard it, it barely happened.',
    dialogue: 'Hearsay, schmearsay! The crown presents gossip, not evidence!',
  },
  {
    id: 'object_everything',
    name: 'I Object to Everything',
    type: 'argument',
    effect: { kind: 'raise_stakes', prestige: 2, difficulty: 3 },
    flavor: 'Make it a spectacle — harder, but worth 2 more Prestige.',
    dialogue: 'I object! To that! And that! And everything else!',
  },
  {
    id: 'sob_story',
    name: 'Sob Story Supreme',
    type: 'argument',
    effect: { kind: 'self', amount: 4 },
    flavor: 'Produce a single theatrical tear.',
    dialogue: 'He never got seconds at supper, your honor. Never.',
  },
  {
    id: 'technicality',
    name: 'Technicality Twirl',
    type: 'argument',
    effect: { kind: 'swap_scores' },
    flavor: 'Spin the scores like a bakery display.',
    dialogue: 'The filing was one crouton out of compliance, your honor.',
  },
  {
    id: 'recess_snacks',
    name: 'Recess for Snacks',
    type: 'argument',
    effect: { kind: 'self_if_food', withFood: 5, withoutFood: 1 },
    flavor: 'Justice delayed is justice delicious.',
    dialogue: 'Defense requests a recess, for snacking purposes.',
  },
  {
    id: 'jury_of_peers',
    name: 'Jury of Hungry Peers',
    type: 'argument',
    effect: { kind: 'raise_stakes', prestige: 1, difficulty: 2 },
    flavor: 'They want a harder case — and a fatter Prestige purse.',
    dialogue: 'We demand a jury of hungry peers, not well-fed burghers! Mmm...burgers...',
  },
  {
    id: 'footnote',
    name: 'Footnote of Destiny',
    type: 'argument',
    effect: { kind: 'self', amount: 2 },
    flavor: 'Small print, big implications.',
    dialogue: 'If it please the court, please note footnote seven, paragraph 3 subsection B which clearly states that my client was destined to do this, and is not guilty by reason of astrology.',
  },
  {
    id: 'circumstantial_crumbs',
    name: 'Circumstantial Crumbs',
    type: 'argument',
    effect: { kind: 'raise_stakes', prestige: 1, difficulty: 1, gp: 2 },
    flavor: 'Harder case, sweeter Prestige and GP if you win.',
    dialogue: 'Those crumbs are merely circumstantial, Your Honor.',
  },
  {
    id: 'appeal_grandmothers',
    name: 'Appeal to Grandmothers',
    type: 'argument',
    effect: { kind: 'spend_prestige', prestigeCost: 1, amount: 5 },
    flavor: 'Nana’s blessing costs Prestige, but moves mountains.',
    dialogue: 'Would your grandmother convict this face? Would she?',
  },
  {
    id: 'kitchen_sink',
    name: 'Kitchen Sink Objection',
    type: 'argument',
    effect: { kind: 'self', amount: 5 },
    flavor: 'Throw everything at the bench and see what sticks.',
    dialogue: "...and the argument was clearly prejudiced, and my client was never read their rights, and also the prosecutor is a jerk who takes the last roll.",
  },
  {
    id: 'suppress_quiche',
    name: 'Motion to Suppress the Quiche',
    type: 'argument',
    effect: { kind: 'self_if_food', withFood: 5, withoutFood: 0 },
    flavor: 'Only works if you still have a snack to “suppress.”',
    dialogue: "Defense moves to suppress that quiche, it's clearly prejudicing the court.",
  },
  {
    id: 'mandatory_lunch',
    name: 'Mandatory Lunch Break',
    type: 'argument',
    effect: { kind: 'ease_case', difficulty: 2, gp: 2 },
    flavor: 'Easier case, but the Crown docks your GP reward.',
    dialogue: 'Your honor, I invoke mandatory lunch break — for justice.',
  },
  {
    id: 'binding_precedent',
    name: 'Binding Precedent (Pie)',
    type: 'argument',
    effect: { kind: 'swap_scores' },
    flavor: 'Cited from the Great Pie Ruling of 1842.',
    dialogue: 'Binding precedent, your honor — Pie v. Crust, eighteen forty-two!',
  },
  {
    id: 'pro_bono',
    name: 'Junior Partner Enthusiasm',
    type: 'argument',
    effect: { kind: 'ease_case', difficulty: 1, prestige: 1 },
    flavor: 'Work cheap: slightly easier case, slightly less Prestige.',
    dialogue: 'Yes, Your Honor, why I am trying to make partner...',
  },
  {
    id: 'character_witness',
    name: 'Character Witness (Hungry Edition)',
    type: 'argument',
    effect: { kind: 'self_if_food', withFood: 4, withoutFood: 2 },
    flavor: 'My client shares their snacks. Credible.',
    dialogue: 'Call the character witness — he saw my client share his lunch!',
  },
  {
    id: 'sidebar_brawl',
    name: 'Sidebar Brawl',
    type: 'argument',
    effect: { kind: 'self_and_raise_stakes', amount: 4, gp: 2, difficulty: 1 },
    flavor: '+4 after a scuffle; +2 GP at stake, difficulty +1.',
    dialogue: 'Your honor, a brief sidebar — and possibly a scuffle.',
  },
  {
    id: 'closing_argument',
    name: 'Closing Argument Flambé',
    type: 'argument',
    effect: { kind: 'self_and_raise_stakes', amount: 5, prestige: 1, difficulty: 2 },
    flavor: '+5 now; win pays +1 Prestige, but difficulty climbs by 2.',
    dialogue: 'And in closing — flambé! — my client is clearly not guilty!',
  },
];

const CASES = [
  {
    id: 'missing_pie',
    name: 'the Missing Pie',
    difficulty: 1,
    gp: 5,
    flavor:
      'COMES NOW the Crown and complains that Defendant did unlawfully take, conceal, and/or consume one (1) pie of substantial sentimental and caloric value, leaving only an empty tin and crumbs of guilt.',
    accusations: [
      'The crust never lies — and neither do these crumbs on the accused!',
      'Your honor, only a guilty party leaves an empty pie tin!',
      'Exhibit A: one missing pie. Exhibit B: one suspiciously full belly!',
      'They claim innocence, yet the pantry door was ajar!',
      'This was no accident — this was dessert with intent!',
      'Convict! Somewhere a perfectly good pie cries for justice!',
    ],
  },
  {
    id: 'mayors_hat',
    name: "Theft of the Mayor's Hat",
    difficulty: 2,
    gp: 6,
    flavor:
      'Plaintiff, the Office of the Mayor, alleges that Defendant did feloniously remove, wear, and/or misappropriate the Mayoral Hat from the civic buffet, thereby depriving the populace of duly authorized headwear.',
    accusations: [
      'The mayor is bareheaded — and this scoundrel is over-hatted!',
      'Your honor, the feather still smells of the buffet!',
      'No honest citizen wears civic authority sideways!',
      'They were seen near the hat… and the gravy boat!',
      'This is not fashion. This is felony millinery!',
      'Return the hat — or face the brim of justice!',
    ],
  },
  {
    id: 'dragon_sheep',
    name: 'Dragon v. Sheep Herder',
    difficulty: 2,
    gp: 8,
    flavor:
      'Plaintiff Dragon complains that Defendant Sheep Herder, by negligence and/or reckless flock management, caused one (1) sheep to be scorched, to Plaintiff’s emotional, financial, and barbecue-related detriment.',
    accusations: [
      'One sheep, one scorch mark, and one very guilty herder!',
      'The dragon merely objected — the herder escalated!',
      'Your honor, wool does not spontaneously combust!',
      'They brought a flock to a firefight!',
      'Negligence, your honor — crispy, fluffy negligence!',
      'The Crown demands restitution… and a fireproof fence!',
    ],
  },
  {
    id: 'talking_mule',
    name: 'the Talking Mule Affidavit',
    difficulty: 2,
    gp: 5,
    flavor:
      'The Crown avers that Defendant did obstruct justice by coaching, silencing, and/or bribing with oats a talking mule whose sworn affidavit remains willfully incomplete.',
    accusations: [
      'The mule spoke — then this defendant made it clam up!',
      'Your honor, silence from a talking mule is highly suspicious!',
      'They coached the witness… the four-legged witness!',
      'Affidavit incomplete? That is obstruction with oats!',
      'Only the guilty fear what a mule might say next!',
      'Hang them — figuratively — for witness-tampering of livestock!',
    ],
  },
  {
    id: 'enchanted_ladle',
    name: 'Custody of the Enchanted Ladle',
    difficulty: 2,
    gp: 7,
    flavor:
      'Petitioner seeks exclusive custody of the Enchanted Ladle, alleging that Respondent seized said ladle against its magical preference and in contempt of prior soup-side rulings.',
    accusations: [
      'The ladle chose a side — and it was not theirs!',
      'They seized magical cookware against its will!',
      'Your honor, enchantment is not a free-for-all!',
      'This is custody interference… with soup powers!',
      'The ladle pointed — we merely followed the scoop!',
      'Convict the grabber before dinner is ruined!',
    ],
  },
  {
    id: 'tavern_tab',
    name: 'the Endless Tavern Tab',
    difficulty: 2,
    gp: 4,
    flavor:
      'Complainant Innkeeper alleges that Defendant did open an endless tavern tab, ordering approximately forty (40) root beers without tender of payment, constituting breach of contract and frothy fraud.',
    accusations: [
      'Forty root beers! That is not thirst — that is conspiracy!',
      'The tab grows, your honor, and so does their guilt!',
      'They ordered endlessly and paid never!',
      'Exhibit froth: a trail of unpaid mugs!',
      'This defendant treats the tavern like a bottomless well!',
      'Close the tab — and open a conviction!',
    ],
  },
  {
    id: 'garden_gnome',
    name: 'Assault by Garden Gnome',
    difficulty: 3,
    gp: 6,
    flavor:
      'The Crown charges that Defendant did willfully arm, aim, and/or unleash a garden gnome bearing a tiny shovel, thereby committing assault with a landscaping ornament.',
    accusations: [
      'A tiny shovel, a large bruise, and a guilty conscience!',
      'They armed a gnome, your honor — with landscaping!',
      'Motive, means, and miniature mayhem!',
      'The gnome confessed… in interpretive pointing!',
      'This was no garden accident — this was premeditation in ceramic!',
      'Convict before more lawn ornaments rise up!',
    ],
  },
  {
    id: 'fake_prophecy',
    name: 'Fraudulent Prophecy Services',
    difficulty: 4,
    gp: 7,
    flavor:
      'Plaintiffs, being persons who paid for rain, complain that Defendant sold fraudulent prophecy services predicting precipitation upon a day that was, in fact and in sunshine, clear — constituting actionable soothsaying fraud.',
    accusations: [
      'They sold sunshine forecasts in a drought of honesty!',
      'False prophecy is fraud with extra drama!',
      'Your honor, the sky was clear — their ledger was not!',
      'They predicted rain and delivered bills!',
      'This soothsayer soothes only their coin purse!',
      'Convict the charlatan before tomorrow’s fake eclipse!',
    ],
  },
  {
    id: 'borrowed_wand',
    name: 'the Borrowed Wand Incident',
    difficulty: 0,
    gp: 5,
    flavor:
      'Lender complains that Defendant borrowed one (1) wand and returned it late, partially melted, and unfit for further enchantment, in breach of the Bailment of Magical Implements.',
    accusations: [
      'Returned late — and lightly melted. Intentional misuse!',
      'A borrowed wand is not a snack, your honor!',
      'They warped the tip and the truth!',
      'Late fees cannot fix magical negligence!',
      'Exhibit spark: one ruined loaner!',
      'Convict! Lenders everywhere tremble!',
    ],
  },
  {
    id: 'pie_contest',
    name: 'the Rigged Pie Contest',
    difficulty: 1,
    gp: 6,
    flavor:
      'Aggrieved bakers allege that the late pie contest was rigged by kinship and crust, the contest judge being related to the declared winner, thereby denying fair dessert competition under the Baking Code.',
    accusations: [
      'The contest was rigged thicker than the filling!',
      'Nepotism in the crust, your honor!',
      'They baked victory before the ovens were hot!',
      'A fair contest does not taste like favoritism!',
      'Blue ribbon? More like blue murder of sportsmanship!',
      'Convict the fixer — dessert integrity is at stake!',
    ],
  },
  {
    id: 'haunted_lease',
    name: 'Breach of Haunted Lease',
    difficulty: 3,
    gp: 7,
    flavor:
      'Spectral tenants complain that Defendant breached Clause 12B of the Haunted Lease by failing to give ghosts thirty (30) days’ written notice prior to mortal renovations, rattling, or eviction.',
    accusations: [
      'Clause 12B violated — the ghosts got no notice!',
      'They breached a haunted lease with mortal cheek!',
      'Your honor, even spirits deserve thirty days!',
      'Unlawful eviction… of the already departed!',
      'The rattling chains are Exhibit A!',
      'Convict! Hauntings have HOAs too!',
    ],
  },
  {
    id: 'stolen_recipe',
    name: 'Grand Theft Recipe',
    difficulty: 3,
    gp: 8,
    flavor:
      'Complainant Chef charges Defendant with grand theft recipe: the knowing taking of a proprietary formula whose secret ingredient was alleged to be friendship, and whose card was filed under “mine now.”',
    accusations: [
      'Grand theft recipe — they stole more than spice!',
      'The secret ingredient was friendship… which they betrayed!',
      'Your honor, ink still wet on the pilfered card!',
      'They filed the recipe under “mine now”!',
      'Culinary larceny, plain as flour!',
      'Convict before another cookbook goes missing!',
    ],
  },
  {
    id: 'owl_noise',
    name: 'Disturbing the Peace (Owls)',
    difficulty: 0,
    gp: 4,
    flavor:
      'Neighborhood complainants allege that Defendant did disturb the peace by keeping, encouraging, and/or failing to silence owls that hooted excessively after midnight, to the loss of sleep and dignity.',
    accusations: [
      'Too many hoots after midnight — willful disturbance!',
      'The neighborhood cannot sleep for their avian racket!',
      'Your honor, this was a hoot with malice aforethought!',
      'Peace was disturbed, and feathers were ruffled!',
      'They trained the owls… or at least encouraged them!',
      'Convict! Let silence return to the eaves!',
    ],
  },
  {
    id: 'counterfeit_jam',
    name: 'the Counterfeit Jam Ring',
    difficulty: 4,
    gp: 7,
    flavor:
      'The Crown indicts Defendant for trafficking in counterfeit jam: jars labeled as berry preserve which were, upon tasting and chemical whimsy, composed mostly of beets and deceit.',
    accusations: [
      'Counterfeit jam — mostly beets, entirely fraud!',
      'They spread lies thicker than the preserve!',
      'Your honor, this jar is a beet-stained deception!',
      'The ring sold sweetness they never made!',
      'Label says berry. Taste says felony!',
      'Convict the jam-forgers of the realm!',
    ],
  },
  {
    id: 'duel_permit',
    name: 'Duel Without a Permit',
    difficulty: 1,
    gp: 6,
    flavor:
      'The Crown alleges that Defendant did engage in a duel without filing Form 12-B or any other required permit, drawing steel where paperwork was due, in violation of the Code of Civilized Scuffling.',
    accusations: [
      'Forms unfiled, swords drawn — open-and-shut!',
      'They dueled without a stamp of approval!',
      'Your honor, bureaucracy before bloodshed!',
      'No permit, no honor — only chaos!',
      'Exhibit steel: unauthorized fencing!',
      'Convict! Next time, bring Form 12-B!',
    ],
  },
  {
    id: 'shapeshifter',
    name: 'Identity Theft by Shapeshifter',
    difficulty: 4,
    gp: 9,
    flavor:
      'True Baker petitions this Court for relief, alleging that Defendant, a shapeshifter, did assume Petitioner’s likeness, apron, and good name, thereby committing identity theft and culinary imposture.',
    accusations: [
      'Which baker is real? The Crown says: not this one!',
      'Identity theft with extra faces!',
      'Your honor, they wore another’s apron — and crimes!',
      'Shapeshifted into guilt itself!',
      'The real baker deserves their name back!',
      'Convict the impostor before dessert is forged again!',
    ],
  },
  {
    id: 'stolen_honeycomb',
    name: 'the Stolen Honeycomb',
    difficulty: 1,
    gp: 5,
    flavor:
      'Beekeepers of the Shire allege that Defendant did unlawfully extract, lick, and/or abscond with one (1) honeycomb of exceptional stickiness, leaving the hive bereft and the wax seals broken.',
    accusations: [
      'Sticky fingers, your honor — and stickier guilt!',
      'The hive mourns what this defendant consumed!',
      'Exhibit buzz: one empty comb and one full belly!',
      'They sweet-talked the bees, then stole the proof!',
      'This was no pollination — this was predation!',
      'Convict! Let justice drip as slow as honey!',
    ],
  },
  {
    id: 'bakers_dozen_fraud',
    name: "the Baker's Dozen Fraud",
    difficulty: 2,
    gp: 6,
    flavor:
      'The Guild of Bakers complains that Defendant sold rolls in quantities of twelve (12) while advertising a baker’s dozen, constituting numerical fraud upon hungry purchasers and the sacred thirteenth roll.',
    accusations: [
      'Twelve rolls where thirteen were promised — fraud!',
      'They shorted the realm one sacred pastry!',
      'Your honor, the thirteenth roll is law, not suggestion!',
      'Exhibit crumb: a dozen lies in a basket!',
      'This defendant counts like a pickpocket!',
      'Convict before every dozen becomes a deception!',
    ],
  },
  {
    id: 'unicorn_parking',
    name: 'Unicorn Parking Violation',
    difficulty: 2,
    gp: 5,
    flavor:
      'Municipal Stablemaster charges that Defendant parked one (1) unicorn in a loading zone reserved for wagons, hay, and lawful complaint, without permit, glitter containment, or horn insurance.',
    accusations: [
      'A unicorn in a loading zone — magical arrogance!',
      'No permit, no hay, no excuse!',
      'Your honor, the horn blocked three honest carts!',
      'They glittered where only commerce may tread!',
      'Parking violation… with mythological entitlement!',
      'Convict! Tow the unicorn of justice!',
    ],
  },
  {
    id: 'cursed_teapot',
    name: 'the Cursed Teapot',
    difficulty: 3,
    gp: 7,
    flavor:
      'Tea Society plaintiffs allege that Defendant knowingly sold a cursed teapot that poured only lukewarm regret, causing social ruin at no fewer than four (4) respectable brunches.',
    accusations: [
      'Four brunches ruined by one malicious pot!',
      'They sold sorrow steeped at room temperature!',
      'Your honor, this teapot cursed the cream itself!',
      'Lukewarm regret is not a beverage — it is a crime!',
      'Exhibit stain: tears in every saucer!',
      'Convict the vendor before tea time ends forever!',
    ],
  },
  {
    id: 'midnight_snack_raid',
    name: 'the Midnight Snack Raid',
    difficulty: 0,
    gp: 4,
    flavor:
      'Household members charge that Defendant did raid the pantry at midnight, consuming one (1) entire wheel of cheese and leaving only a note reading “borrowed forever,” in violation of domestic treaty.',
    accusations: [
      'Midnight raid! The cheese wheel is gone!',
      'They left a note — but not the dairy!',
      'Your honor, “borrowed forever” is still theft!',
      'Exhibit rind: crumbs on the stair at twelve o’clock!',
      'This was no snack — it was a siege!',
      'Convict! The pantry demands restitution!',
    ],
  },
  {
    id: 'false_alibi_pigeon',
    name: 'the False Alibi Pigeon',
    difficulty: 2,
    gp: 6,
    flavor:
      'The Crown alleges that Defendant coached a carrier pigeon to deliver a false alibi, thereby obstructing justice by airmail and feathered perjury.',
    accusations: [
      'The pigeon lied — and so did they!',
      'Your honor, alibis should not have wings!',
      'Feathered perjury delivered by beak!',
      'They coached the witness… the winged witness!',
      'Exhibit coo: one forged timeline!',
      'Convict before every bird becomes a liar!',
    ],
  },
  {
    id: 'soup_kitchen_racket',
    name: 'the Soup Kitchen Racket',
    difficulty: 3,
    gp: 8,
    flavor:
      'Charitable trustees complain that Defendant operated a soup kitchen that served mostly water, ambition, and one (1) lonely crouton, while collecting donations for “hearty broth.”',
    accusations: [
      'One crouton for twelve bowls — charity fraud!',
      'They ladled water and called it mercy!',
      'Your honor, the broth was a mirage!',
      'Donations taken, hunger left standing!',
      'Exhibit ladle: nearly empty of virtue!',
      'Convict the soup racketeer of the realm!',
    ],
  },
  {
    id: 'butter_heist',
    name: 'the Great Butter Heist',
    difficulty: 1,
    gp: 5,
    flavor:
      'Dairy Guild alleges that Defendant did feloniously abscond with three (3) pounds of churned butter intended for the Harvest Fair, leaving rolls dry and hearts broken.',
    accusations: [
      'Three pounds of butter — gone without a churn!',
      'They spread guilt on every dry roll!',
      'Your honor, the fair was robbed of richness!',
      'Exhibit grease: fingerprints on the crock!',
      'This was churned larceny, plain and salty!',
      'Convict! Bring back the butter of justice!',
    ],
  },
  {
    id: 'wizard_tax_evasion',
    name: 'Wizard Tax Evasion',
    difficulty: 4,
    gp: 9,
    flavor:
      'Revenue Wizards charge that Defendant concealed approximately forty (40) spell components inside a “lunchbox of mundane sandwiches,” evading the Arcane Excise Tax.',
    accusations: [
      'Spell components in a lunchbox — tax fraud by sorcery!',
      'They hid magic among the mundane!',
      'Your honor, sandwiches do not sparkle on their own!',
      'Forty components, zero declarations!',
      'Exhibit sparkle: undeclared enchantment!',
      'Convict the conjurer who cooked the books!',
    ],
  },
  {
    id: 'runaway_sourdough',
    name: 'the Runaway Sourdough',
    difficulty: 2,
    gp: 7,
    flavor:
      'Bakery owner petitions for return of one (1) sourdough starter that Defendant allegedly abducted, renamed, and entered in a rival county’s bread competition under false parentage.',
    accusations: [
      'They stole the starter — and its legacy!',
      'Your honor, sourdough has one true home!',
      'False parentage in the bread competition!',
      'Exhibit bubble: a living culture kidnapped!',
      'This is starter-napping with culinary intent!',
      'Convict before yeast turns witness against us all!',
    ],
  },
  {
    id: 'pickled_evidence',
    name: 'Pickling of Evidence',
    difficulty: 1,
    gp: 6,
    flavor:
      'The Crown alleges that Defendant obstructed justice by pickling Exhibit C—a material witness in jar form—thereby rendering it brined, unreadable, and deliciously unavailable.',
    accusations: [
      'They pickled the evidence — literally!',
      'Exhibit C is now Exhibit brine!',
      'Your honor, justice cannot ferment in vinegar!',
      'They preserved the proof… against the Crown!',
      'Obstruction with dill and malice!',
      'Convict! Unseal the jar of truth!',
    ],
  },
  {
    id: 'truffle_smuggling',
    name: 'Truffle Smuggling',
    difficulty: 4,
    gp: 8,
    flavor:
      'Forest Wardens charge that Defendant smuggled rare truffles past the Mushroom Checkpoint inside hollowed boots, constituting gourmet contraband and fungal felony.',
    accusations: [
      'Truffles in the boots — smuggling with aroma!',
      'They walked past the checkpoint… suspiciously earthy!',
      'Your honor, these fungi were fugitives!',
      'Hollow boots, full crimes!',
      'Exhibit sniff: guilt has an expensive smell!',
      'Convict the fungal felon of the forest!',
    ],
  },
  {
    id: 'pancake_perjury',
    name: 'Pancake Perjury',
    difficulty: 0,
    gp: 4,
    flavor:
      'Breakfast Tribunal alleges that Defendant swore under oath that they had not flipped the communal pancake, while syrup evidence on their sleeve suggests otherwise.',
    accusations: [
      'Syrup on the sleeve — pancake perjury!',
      'They flipped it and lied about the flip!',
      'Your honor, the batter does not lie!',
      'Oath taken, pancake violated!',
      'Exhibit drip: maple proof of guilt!',
      'Convict! Let breakfast truth prevail!',
    ],
  },
  {
    id: 'cheese_wheel_rolling',
    name: 'the Cheese Wheel Rolling Incident',
    difficulty: 3,
    gp: 6,
    flavor:
      'Village elders complain that Defendant rolled a ceremonial cheese wheel down Main Street during market hours, causing panic, dented carts, and unauthorized dairy velocity.',
    accusations: [
      'Unauthorized dairy velocity on Main Street!',
      'They rolled justice away in a wheel of cheddar!',
      'Your honor, carts were dented by cheese!',
      'Ceremonial wheels are not projectiles!',
      'Exhibit rumble: panic in the marketplace!',
      'Convict before another round of dairy chaos!',
    ],
  },
  {
    id: 'midnight_baking_noise',
    name: 'Midnight Baking Noise',
    difficulty: 1,
    gp: 5,
    flavor:
      'Neighbors allege that Defendant operated a full bakery—including kneading, shouting, and triumphantly ringing a bell—at midnight, disturbing the peace and every sleeping halfling.',
    accusations: [
      'Kneading at midnight — willful noise!',
      'They rang the victory bell in our nightmares!',
      'Your honor, dough should not shout after dark!',
      'Peace disturbed by yeast and enthusiasm!',
      'Exhibit thump: boots on ceiling at twelve!',
      'Convict! Let the neighborhood sleep again!',
    ],
  },
  {
    id: 'impersonating_the_cook',
    name: 'Impersonating the Cook',
    difficulty: 4,
    gp: 7,
    flavor:
      'Head Chef alleges that Defendant donned the sacred apron, wielded the ladle of office, and issued unlawful menu decrees—including “dessert first”—while impersonating the lawful cook.',
    accusations: [
      'They wore the apron without authority!',
      'Dessert first is not a lawful decree!',
      'Your honor, the ladle was seized unlawfully!',
      'Impersonating the cook is culinary treason!',
      'Exhibit menu: chaos in pudding form!',
      'Convict the false chef before dinner revolts!',
    ],
  },
];

function caseById(id) {
  return CASES.find((c) => c.id === id) || null;
}

function argumentById(id) {
  return ARGUMENTS.find((a) => a.id === id) || null;
}

/** Merge canonical argument dialogue onto a deck/hand/play instance. */
function enrichArgumentCard(card) {
  if (!card) return card;
  const base = (card.id && argumentById(card.id)) || ARGUMENTS.find((a) => a.name === card.name);
  if (!base) return card;
  return {
    ...card,
    id: base.id,
    name: base.name,
    type: 'argument',
    dialogue: base.dialogue,
    flavor: base.flavor ?? card.flavor,
    effect: card.effect ?? base.effect,
    image: card.image || base.image,
  };
}

function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

/** Merge canonical recipe/judge dialogue onto a recipe or food token. */
function enrichRecipeCard(card) {
  if (!card) return card;
  const base =
    (card.id && recipeById(card.id)) ||
    (card.recipeId && recipeById(card.recipeId)) ||
    RECIPES.find((r) => r.name === card.name);
  if (!base) return card;
  return {
    ...card,
    id: base.id,
    recipeId: card.recipeId || base.id,
    name: base.name,
    judgeDialogue: base.judgeDialogue,
    flavor: base.flavor ?? card.flavor,
    effect: card.effect ?? base.effect,
    image: card.image || base.image,
  };
}

/** Merge canonical case text onto a deck instance (fixes stale in-memory cards). */
function enrichCaseCard(card) {
  if (!card?.id) return card;
  const base = caseById(card.id);
  if (!base) return card;
  return {
    ...card,
    id: base.id,
    name: base.name,
    difficulty: card.difficulty ?? base.difficulty,
    gp: card.gp ?? base.gp,
    flavor: base.flavor,
    accusations: base.accusations,
    type: 'case',
  };
}

function prosecutorAccusationFor(caseCard, roll) {
  const canonical = enrichCaseCard(caseCard);
  const lines = canonical?.accusations;
  if (Array.isArray(lines) && lines.length) {
    const idx = Math.max(0, Math.min(lines.length - 1, (Number(roll) || 1) - 1));
    return lines[idx];
  }
  return 'The Crown finds the defendant most suspicious!';
}
const INGREDIENT_COST_WEIGHTS = [
  { cost: 1, weight: 4 },
  { cost: 2, weight: 3 },
  { cost: 3, weight: 2 },
];

const COST_WEIGHTS = [
  { cost: 1, weight: 3 },
  { cost: 2, weight: 4 },
  { cost: 3, weight: 4 },
  { cost: 4, weight: 3 },
  { cost: 5, weight: 2 },
];

function weightedIngredientCost(rng = Math.random) {
  const total = INGREDIENT_COST_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = rng() * total;
  for (const w of INGREDIENT_COST_WEIGHTS) {
    roll -= w.weight;
    if (roll <= 0) return w.cost;
  }
  return 2;
}

function weightedCost(rng = Math.random) {
  const total = COST_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = rng() * total;
  for (const w of COST_WEIGHTS) {
    roll -= w.weight;
    if (roll <= 0) return w.cost;
  }
  return 3;
}

function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeMarketCard(base, cost, instanceId) {
  return {
    ...base,
    instanceId,
    cost,
  };
}

function buildIngredientDeck(rng = Math.random) {
  const deck = [];
  let n = 0;
  const uid = () => `i${++n}`;
  for (const ing of INGREDIENTS) {
    for (let i = 0; i < 8; i++) {
      deck.push(makeMarketCard(ing, weightedIngredientCost(rng), uid()));
    }
  }
  return shuffle(deck, rng);
}

function buildRecipeDeck(rng = Math.random) {
  let n = 0;
  return shuffle(
    RECIPES.map((rec) => ({ ...rec, instanceId: `r${++n}` })),
    rng
  );
}

function buildArgumentDeck(rng = Math.random) {
  const deck = [];
  let n = 0;
  const uid = () => `a${++n}`;
  for (const arg of ARGUMENTS) {
    const copies = arg.effect.kind === 'self' && (arg.effect.amount || 0) >= 8 ? 1 : 2;
    for (let i = 0; i < copies; i++) {
      deck.push({ ...arg, instanceId: uid() });
    }
  }
  return shuffle(deck, rng);
}

/** @deprecated unified market deck — use separate decks */
function buildMarketDeck(rng = Math.random) {
  return buildIngredientDeck(rng);
}

function buildCaseDeck(rng = Math.random) {
  let n = 0;
  return shuffle(
    CASES.map((c) => ({ ...c, type: 'case', instanceId: `c${++n}` })),
    rng
  );
}

function getIngredientName(id) {
  return INGREDIENTS.find((i) => i.id === id)?.name || id;
}

function describeEffect(effect) {
  if (!effect) return '';
  switch (effect.kind) {
    case 'self':
      return `+${effect.amount} to your score`;
    case 'self_and_opp':
      return `+${effect.self} to you; difficulty ${effect.opp >= 0 ? '+' : ''}${effect.opp}`;
    case 'nullify_last_food':
      return 'Nullify the last Food effect';
    case 'nullify_last_argument':
      return 'Nullify the last Legal Argument';
    case 'force_pass':
      return 'Lower case difficulty by 2';
    case 'swap_scores':
      return 'Swap your score with the case difficulty';
    case 'end_case_no_score':
      return 'End case; nobody scores';
    case 'self_if_food':
      return `+${effect.withFood} if you have food, else +${effect.withoutFood}`;
    case 'self_and_force_pass':
      return `+${effect.amount} and lower difficulty by 1`;
    case 'spend_prestige':
      return `Spend ${effect.prestigeCost} Prestige; +${effect.amount} to your score`;
    case 'raise_stakes': {
      const bits = [];
      if (effect.difficulty) bits.push(`difficulty +${effect.difficulty}`);
      if (effect.prestige) bits.push(`case Prestige +${effect.prestige}`);
      if (effect.gp) bits.push(`case GP +${effect.gp}`);
      return bits.join('; ') || 'Raise the stakes';
    }
    case 'ease_case': {
      const bits = [`difficulty −${effect.difficulty || 0}`];
      if (effect.gp) bits.push(`case GP −${effect.gp}`);
      if (effect.prestige) bits.push(`case Prestige −${effect.prestige}`);
      return bits.join('; ');
    }
    case 'self_and_raise_stakes': {
      const bits = [`+${effect.amount} to your score`];
      if (effect.difficulty) bits.push(`difficulty +${effect.difficulty}`);
      if (effect.prestige) bits.push(`case Prestige +${effect.prestige}`);
      if (effect.gp) bits.push(`case GP +${effect.gp}`);
      return bits.join('; ');
    }
    default:
      return '';
  }
}

function getRecipeImage(id) {
  return `/assets/food/${id}.png`;
}

function getStarterRecipePool() {
  return RECIPES.filter((recipe) => recipe.effect?.kind === 'self' && (recipe.effect.amount ?? 99) <= 3);
}

function dealStarterRecipes(playerCount, perPlayer = 2, rng = Math.random) {
  const pool = shuffle(getStarterRecipePool(), rng);
  if (!pool.length) return Array.from({ length: playerCount }, () => [RECIPES[0], RECIPES[1] || RECIPES[0]]);
  const dealt = [];
  const used = new Set();
  for (let i = 0; i < playerCount; i++) {
    const hand = [];
    for (let j = 0; j < perPlayer; j++) {
      let pick = pool.find((r) => !used.has(r.id));
      if (!pick) pick = pool[(i * perPlayer + j) % pool.length] || RECIPES[0];
      used.add(pick.id);
      hand.push(pick);
    }
    dealt.push(hand);
  }
  return dealt;
}

function drawRandomIngredients(count, rng = Math.random) {
  const pool = shuffle(
    INGREDIENTS.flatMap((ing) => [ing, ing, ing, ing]),
    rng
  );
  return pool.slice(0, count).map((ing, i) => ({
    id: ing.id,
    name: ing.name,
    type: 'ingredient',
    flavor: ing.flavor,
    image: ing.image,
    instanceId: `start_ing_${Date.now()}_${i}_${Math.floor(rng() * 9999)}`,
  }));
}

function getStarterRecipe() {
  return getStarterRecipePool()[0] || RECIPES[0];
}

module.exports = {
  INGREDIENTS,
  RECIPES,
  ARGUMENTS,
  CASES,
  caseById,
  argumentById,
  recipeById,
  enrichCaseCard,
  enrichArgumentCard,
  enrichRecipeCard,
  prosecutorAccusationFor,
  buildMarketDeck,
  buildIngredientDeck,
  buildRecipeDeck,
  buildArgumentDeck,
  buildCaseDeck,
  getIngredientName,
  describeEffect,
  getStarterRecipe,
  getRecipeImage,
  getStarterRecipePool,
  dealStarterRecipes,
  drawRandomIngredients,
  shuffle,
};
