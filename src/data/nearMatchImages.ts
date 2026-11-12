// Closest-looking local photo for ERP items that have no exact product photo.
// Rules are checked in order against the upper-cased item name; the first match wins,
// so put specific phrases before general ones.
const P = (code: string) => `/images/products/${code}.webp`;
const T = (n: number) => `/images/tool_${n}.webp`;

export const NEAR_MATCH_RULES: [RegExp, string][] = [
  // Accessories first, so "DRILL BIT" doesn't fall through to "DRILL"
  [/SDS.*(CHISEL)|CHISEL.*SDS/, P('DBC0224001')],
  [/SDS.*(BIT|DRILL \d|\d+\s*\*\s*\d+)|HAMMER DRILL BIT/, P('DBH1211801')],
  [/WOOD (DRILL )?BIT|SPADE BIT|AUGER BIT/, P('AKDB5055')],
  [/DRILL BIT|HSS|MASONRY BIT|BIT SET|COBALT/, T(21)],
  [/KEY CHUCK|CHUCK KEY|DRILL CHU?CK/, P('KC1301')],
  [/MIX(ING)? PADDLE|PADDLE/, P('MP1120')],
  [/\d+(\.\d+)?\s*AH\b.*BATTERY|BATTERY PACK|LI-?ION.*BATTERY/, P('FBLI20011')],
  [/CHARGER/, P('CUCLI2001')],

  // Other consumables and spare parts: better a generic photo than a machine they are not
  [/BLADE|DISC|WHEEL|BRUSH|PAD|NUT|CHAIN|WIRE|CABLE|GOGGLE|GLOVE|GAUGE|SWITCH|SPOOL|LINE|BELT|MAGNET|ARMATURE|CARBON|SPARE|GEAR|BEARING|STATOR|FILTER|BATTERY|TAP|JACKET|NOZZLE TIP/, ''],

  // Power tools
  [/ROTARY HAMMER|DEMOLITION|BREAKER|PERCUSSION HAMMER|SDS/, T(13)],
  [/IMPACT WRENCH/, T(7)],
  [/IMPACT (DRILL|DRIVER)|HAMMER DRILL|CORDLESS DRILL|DRILL DRIVER|SCREW ?DRIVER.*(CORDLESS|DC\s*\d)/, T(6)],
  [/MAGN[AE]TIC DRILL|BENCH DRI+L|DRILL PRESS/, T(16)],
  [/\bDRILL\b/, T(16)],
  [/BENCH GRINDER/, P('BG83502')],
  [/DIE GRINDER|ANGLE GRINDER|\bGRINDER\b/, T(10)],
  [/MITE?RE? SAW|CUT ?OFF|CHOP SAW|MARBLE CUTTER|TILE CUTTER(?!.*MANUAL)/, T(19)],
  [/CIRCULAR SAW(?! BLADE)/, T(5)],
  [/JIG ?SAW/, P('JS57028')],
  [/PLANER/, T(14)],
  [/HEAT GUN|HOT AIR/, T(15)],
  [/MIXER/, P('MX214008')],
  [/TRIMMER|BRUSH ?CUTTER|GRASS/, P('CGTLI20018')],
  [/WELDING TORCH|ELECTRODE HOLDER|EARTH CLAMP/, P('WAH3008')],
  [/WELD|INVERTER|\bMMA\b|\bTIG\b|\bMIG\b/, T(17)],
  [/COMPRESSOR/, T(22)],
  [/PUMP CONTROL|PRESSURE (SWITCH|CONTROL)/, P('WAPS001')],
  [/(AIR|PAINT) ?SPRAY GUN|SPRAY GUN/, P('ASG4042')],
  [/HIGH PRESSURE HOSE|AIR HOSE/, P('AHPH5028')],
  [/SPRINKLER/, P('HPS23602')],
  [/NOZZLE/, P('HHCS05122')],
  [/HOSE (CONNECTOR|MENDER|COUPL)|QUICK CONNECTOR/, P('HHCS03122')],

  // Hand tools
  [/SOCKET SET|RATCHET.*SET|TOOL SET|TOOL KIT/, T(20)],
  [/SOCKET/, P('HHAST12133L')],
  [/RATCHET SPANNER|GEAR WRENCH/, P('HCSPAR131')],
  [/SPANNER|WRENCH/, P('HCSPA121')],
  [/WIRE STRIP/, P('HWSP08168')],
  [/DIAGONAL|SIDE CUTT|CUTTING PLIER/, P('HDCP08188')],
  [/PLIER/, P('HWSP08168')],
  [/SNIP|TIN CUTTER/, P('HTSN0110S')],
  [/SCREW ?DRIVER|SCREWDRIVER/, P('HSGTDC180601')],
  [/WOOD CHISEL|\bCHISEL\b/, P('HWC0806')],
  [/RIVET/, P('HFOR321')],
  [/STAPLE/, P('HSG1404')],
  [/KNIFE|CUTTER BLADE|SNAP.?OFF/, P('HKNS1806')],
  [/GLASS CUTTER/, P('HGCT02')],
  [/HOLE PUNCH/, P('HLHP01')],
  [/COMPASS SAW|HAND SAW|HACKSAW|HACK SAW/, P('HCS3008')],
  [/RULER|SPIRIT LEVEL|\bLEVEL\b|SQUARE/, P('HAR01060')],
  [/JACK/, P('HBJ5002')],
  [/RATCHET STRAP|TIE ?DOWN|CARGO/, P('HRSP3101')],
  [/RAKE|SHOVEL|SPADE|HOE|GARDEN/, P('HGT979K')],
];

export function getNearMatchImage(name: string): string | undefined {
  const upper = name.toUpperCase();
  for (const [re, img] of NEAR_MATCH_RULES) if (re.test(upper)) return img || undefined;
  return undefined;
}
