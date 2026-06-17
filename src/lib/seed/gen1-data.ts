/**
 * Gen 1 of the FloraDex — a curated Midwest roadside foraging seed set. Each plant maps to a
 * scientific name, common name(s), an edibility bucket derived from its E/M/D/☠ flags, and the
 * season tag(s) you'd most naturally engage with it. Edibility here is deliberately
 * conservative (a starting point); the per-species reference pages refine it.
 */
type Tuple = [scientific: string, common: string, flags: string];

const SPRING_SEASONS = ['early_spring', 'mid_spring', 'late_spring'];
const SUMMER_SEASONS = ['early_summer', 'mid_summer', 'late_summer'];
const FALL_SEASONS = ['early_fall', 'mid_fall', 'late_fall'];
const ALL_SEASONS = [...SPRING_SEASONS, ...SUMMER_SEASONS, ...FALL_SEASONS, 'winter'];

const SPRING: Tuple[] = [
  ['Alliaria petiolata', 'Garlic mustard', 'E'],
  ['Allium spp.', 'Wild onion / field garlic', 'E ⚠'],
  ['Asarum canadense', 'Wild ginger', 'M ⚠'],
  ['Barbarea vulgaris', 'Winter cress / yellow rocket', 'E'],
  ['Capsella bursa-pastoris', "Shepherd's purse", 'E'],
  ['Caulophyllum thalictroides', 'Blue cohosh', 'M/D ⚠'],
  ['Cercis canadensis', 'Redbud', 'E'],
  ['Claytonia virginica', 'Spring beauty', 'E'],
  ['Convallaria majalis', 'Lily of the valley', 'D ⚠'],
  ['Galium aparine', 'Cleavers', 'E/M'],
  ['Glechoma hederacea', 'Ground ivy / creeping charlie', 'E spirit'],
  ['Lamium spp.', 'Henbit / dead-nettle', 'E'],
  ['Laportea canadensis', 'Wood nettle', 'E'],
  ['Lepidium spp.', 'Peppergrass', 'E'],
  ['Lindera benzoin', 'Spicebush', 'E/M'],
  ['Maianthemum racemosum', "False Solomon's seal", 'M ⚠'],
  ['Nasturtium officinale', 'Watercress', 'E'],
  ['Ornithogalum umbellatum', 'Star of Bethlehem', 'D ⚠'],
  ['Packera glabella', 'Butterweed', 'D ⚠'],
  ['Podophyllum peltatum', 'Mayapple', 'E/D ⚠'],
  ['Polygonatum biflorum', "Solomon's seal", 'E/M'],
  ['Ranunculus spp.', 'Buttercup', 'D ⚠'],
  ['Robinia pseudoacacia', 'Black locust', 'E/D ⚠'],
  ['Rumex crispus', 'Curly dock', 'E'],
  ['Rumex acetosella', 'Sheep sorrel', 'E'],
  ['Sanguinaria canadensis', 'Bloodroot', 'M/D ⚠'],
  ['Sassafras albidum', 'Sassafras', 'E/M'],
  ['Sonchus spp.', 'Sow thistle', 'E'],
  ['Stellaria media', 'Chickweed', 'E'],
  ['Taraxacum officinale', 'Dandelion', 'E'],
  ['Thlaspi arvense', 'Field pennycress', 'E'],
  ['Toxicoscordion spp.', 'Death camas', 'D ⚠'],
  ['Typha latifolia', 'Cattail', 'E'],
  ['Urtica dioica', 'Stinging nettle', 'E/M'],
  ['Viola sororia', 'Common blue violet', 'E'],
];

const SUMMER: Tuple[] = [
  ['Achillea millefolium', 'Yarrow', 'M'],
  ['Actaea racemosa', 'Black cohosh', 'M'],
  ['Agrimonia spp.', 'Agrimony', 'M'],
  ['Amelanchier arborea', 'Serviceberry', 'E'],
  ['Amaranthus spp.', 'Amaranth / pigweed', 'E'],
  ['Apocynum cannabinum', 'Dogbane / Indian hemp', 'D ⚠'],
  ['Arctium spp.', 'Burdock', 'E/M spirit'],
  ['Artemisia vulgaris', 'Mugwort', 'M spirit'],
  ['Asclepias syriaca', 'Common milkweed', 'E ⚠'],
  ['Asclepias tuberosa', 'Butterfly milkweed / pleurisy root', 'M'],
  ['Ceanothus americanus', 'New Jersey tea', 'M'],
  ['Chenopodium album', "Lamb's quarters", 'E'],
  ['Chimaphila umbellata', 'Pipsissewa', 'M'],
  ['Cichorium intybus', 'Chicory', 'E/M'],
  ['Cicuta maculata', 'Water hemlock', 'D ☠'],
  ['Conium maculatum', 'Poison hemlock', 'D ☠'],
  ['Cynoglossum officinale', "Hound's tongue", 'D ⚠'],
  ['Daucus carota', "Queen Anne's lace / wild carrot", 'E ⚠'],
  ['Delphinium carolinianum', 'Carolina larkspur', 'D ⚠'],
  ['Datura stramonium', 'Datura / jimsonweed', 'D ☠'],
  ['Desmanthus illinoensis', 'Illinois bundleflower', 'E'],
  ['Dioscorea villosa', 'Wild yam', 'M'],
  ['Digitalis spp.', 'Foxglove', 'D ⚠'],
  ['Dipsacus spp.', 'Teasel', 'spirit'],
  ['Echinacea spp.', 'Purple coneflower', 'M'],
  ['Euphorbia marginata', 'Snow-on-the-mountain', 'D ⚠'],
  ['Euphorbia spp.', 'Leafy / cypress spurge', 'D ⚠'],
  ['Hedeoma pulegioides', 'American pennyroyal', 'M ⚠'],
  ['Helianthus tuberosus', 'Jerusalem artichoke', 'E'],
  ['Hemerocallis fulva', 'Daylily', 'E'],
  ['Heracleum maximum', 'Cow parsnip', 'D ⚠'],
  ['Hypericum perforatum', "St. John's wort", 'M'],
  ['Impatiens capensis', 'Jewelweed', 'M spirit'],
  ['Inula helenium', 'Elecampane', 'M'],
  ['Lactuca spp.', 'Wild lettuce', 'E/M'],
  ['Leonurus cardiaca', 'Motherwort', 'M'],
  ['Malva neglecta', 'Common mallow', 'E'],
  ['Marrubium vulgare', 'Horehound', 'M'],
  ['Mentha arvensis', 'Wild mint', 'E/M'],
  ['Monarda didyma', 'Bee balm / Oswego tea', 'M'],
  ['Monarda fistulosa', 'Wild bergamot', 'E/M'],
  ['Morus spp.', 'Mulberry', 'E'],
  ['Nepeta cataria', 'Catnip', 'M'],
  ['Nicandra physalodes', 'Apple of Peru', 'D ⚠'],
  ['Oenothera biennis', 'Evening primrose', 'M'],
  ['Oxalis spp.', 'Wood sorrel', 'E'],
  ['Pastinaca sativa', 'Wild parsnip', 'D ⚠'],
  ['Physalis spp.', 'Ground cherry', 'E ⚠'],
  ['Phytolacca americana', 'Pokeweed', 'E/D ⚠'],
  ['Plantago lanceolata', 'Narrowleaf / English plantain', 'E/M'],
  ['Plantago major', 'Broadleaf plantain', 'E/M'],
  ['Plantago rugelii', 'Pale / blackseed plantain', 'E/M'],
  ['Portulaca oleracea', 'Purslane', 'E'],
  ['Prunella vulgaris', 'Self-heal', 'M'],
  ['Prunus serotina', 'Black cherry', 'E ⚠'],
  ['Prunus virginiana', 'Chokecherry', 'E ⚠'],
  ['Pycnanthemum spp.', 'Mountain mint', 'M'],
  ['Ribes spp.', 'Gooseberry / currant', 'E'],
  ['Ricinus communis', 'Castor bean', 'D ☠'],
  ['Rosa spp.', 'Wild rose', 'E/M'],
  ['Rubus occidentalis', 'Black raspberry', 'E'],
  ['Rubus spp.', 'Blackberry / dewberry', 'E'],
  ['Sambucus canadensis', 'Elderberry', 'E/M ⚠'],
  ['Scutellaria spp.', 'Skullcap', 'M'],
  ['Securigera varia', 'Crown vetch', 'D ⚠'],
  ['Senecio spp.', 'Groundsel / ragwort', 'D ⚠'],
  ['Senna spp.', 'Wild senna', 'M'],
  ['Solanum dulcamara', 'Bittersweet nightshade', 'D spirit ⚠'],
  ['Solanum nigrum', 'Black nightshade', 'D ⚠'],
  ['Solanum carolinense', 'Horse nettle', 'D ⚠'],
  ['Solanum rostratum', 'Buffalo bur', 'D ⚠'],
  ['Toxicodendron radicans', 'Poison ivy', 'D ⚠'],
  ['Toxicodendron vernix', 'Poison sumac', 'D ⚠'],
  ['Verbascum thapsus', 'Mullein', 'M spirit'],
  ['Verbena spp.', 'Blue vervain', 'M'],
];

const FALL: Tuple[] = [
  ['Ageratina altissima', 'White snakeroot', 'D ⚠'],
  ['Asimina triloba', 'Pawpaw', 'E'],
  ['Carya illinoinensis', 'Pecan', 'E'],
  ['Carya spp.', 'Hickory', 'E'],
  ['Celastrus spp.', 'Oriental / American bittersweet', 'D ⚠'],
  ['Celtis occidentalis', 'Hackberry', 'E'],
  ['Corylus americana', 'Hazelnut', 'E'],
  ['Crataegus spp.', 'Hawthorn', 'E'],
  ['Diospyros virginiana', 'Persimmon', 'E'],
  ['Eupatorium perfoliatum', 'Boneset', 'M'],
  ['Eutrochium spp.', 'Joe-pye weed', 'M'],
  ['Juglans nigra', 'Black walnut', 'E'],
  ['Maclura pomifera', 'Osage orange', 'spirit'],
  ['Malus spp.', 'Crabapple', 'E'],
  ['Menispermum canadense', 'Moonseed', 'D ⚠'],
  ['Panax quinquefolius', 'American ginseng', 'M'],
  ['Parthenocissus quinquefolia', 'Virginia creeper', 'D ⚠'],
  ['Prunus americana', 'Wild plum', 'E'],
  ['Quercus spp.', 'Oak / acorns', 'E'],
  ['Rhamnus spp.', 'Buckthorn', 'D ⚠'],
  ['Rhus spp.', 'Sumac (staghorn / smooth)', 'E ⚠'],
  ['Solidago spp.', 'Goldenrod', 'M'],
  ['Viburnum spp.', 'Nannyberry / blackhaw', 'E'],
  ['Vitis spp.', 'Wild grape', 'E ⚠'],
];

const YEAR_ROUND: Tuple[] = [['Taxus spp.', 'Yew', 'D ⚠']];

export interface SeedPlant {
  scientificName: string;
  commonNames: string[];
  flags: string;
  harvestSeasons: string[];
}

function build(t: Tuple, seasons: string[]): SeedPlant {
  return {
    scientificName: t[0],
    commonNames: t[1].split('/').map((s) => s.trim()).filter(Boolean),
    flags: t[2],
    harvestSeasons: seasons,
  };
}

export const GEN1: SeedPlant[] = [
  ...SPRING.map((t) => build(t, SPRING_SEASONS)),
  ...SUMMER.map((t) => build(t, SUMMER_SEASONS)),
  ...FALL.map((t) => build(t, FALL_SEASONS)),
  ...YEAR_ROUND.map((t) => build(t, ALL_SEASONS)),
];

/** Conservative edibility bucket from the flag string. References refine this per plant. */
export function edibilityFor(flags: string): string | undefined {
  if (flags.includes('☠')) return 'deadly';
  const hasD = flags.includes('D');
  const hasE = flags.includes('E');
  if (hasD && hasE) return 'conditionally_edible';
  if (hasD) return 'toxic';
  if (hasE) return 'edible_cooked';
  return undefined; // medicinal-only or lore-only
}

export const GEN1_LESSON_TITLE = 'Midwest Roadside Foraging — Gen 1';

export const GEN1_LESSON_BODY = `Welcome to Gen 1 of your FloraDex — roughly 135 plants of the Midwest roadside, ditch, fencerow, and field edge. The goal isn't to memorize them at once; it's to meet them one season at a time, log what you actually find, and slowly "weed out" the ones you can name on sight from the ones that still fool you.

THE ONE RULE
Never eat anything on a guess. A positive ID means every key feature checks out and you've ruled out the look-alikes — not "it looks about right." When in doubt, photograph it, log a sighting, generate a reference, and come back.

THE LEGEND
• E — edible (often needs the right part, season, or cooking)
• M — medicinal in folk/historical use (not medical advice)
• D — toxic
• ☠ — can kill
• ⚠ — caution: a dangerous look-alike or a straddler that's both food and hazard
• spirit — boundary/lore plant

THE CLUSTER THAT KILLS — THE CARROT FAMILY (summer)
This is the single most important page in the book. White umbrella-shaped flower heads on roadsides include plants you eat AND plants that kill within hours:
• Queen Anne's lace / wild carrot (Daucus carota) — E ⚠: carrot smell, hairy stem, single dark floret in the center.
• Poison hemlock (Conium maculatum) — ☠: smooth stem with PURPLE blotches, musty smell, no hairs.
• Water hemlock (Cicuta maculata) — ☠: the most lethal plant on this list; wet ground, chambered base.
• Wild parsnip (Pastinaca sativa) — D: yellow flowers, sap causes burns in sunlight.
• Cow parsnip (Heracleum maximum) — D: huge; phototoxic sap.
Learn these five as a SET before you trust any wild carrot.

OTHER DEADLY HEADLINERS
Datura/jimsonweed, castor bean, foxglove, death camas, lily of the valley, white snakeroot, and yew (evergreen, red arils) — all can be fatal. The nightshade clan (bittersweet, black, horse nettle, buffalo bur) and the spurges round out the "look, don't taste" list.

CLASSIC LOOK-ALIKE PAIRS TO INTERNALIZE
• Wild onion/garlic — must SMELL of onion; if it doesn't, suspect death camas.
• Pokeweed — young shoots eaten cooked by some, but berries/roots are toxic; a true straddler.
• Elderberry vs. its toxic raw state — cook it.
• Black cherry / chokecherry — fruit edible, foliage & pits cyanogenic.

HOW TO WORK THROUGH GEN 1
1. Filter the Species list by season ("in season now" on Today) and by edibility.
2. When you find one, use Quick Capture: photo, set the phenophase (flowering/fruiting), drop a pin.
3. Generate a reference page and ask the ArchDruid what separates it from its look-alikes.
4. Export the field guide (Settings → Print field guide) and the CSV as you go.

Edit this entry freely — it's your notebook. Cull what you've mastered; star what still trips you up.`;
