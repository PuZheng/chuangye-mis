import { $$page, $$chargeBillDef, $$chargeBillData } from './page.js';
import * as dataSlots from './data-slots.js';

export default Object.assign({}, dataSlots, {
  $$page,
  $$chargeBillData,
  $$chargeBillDef
});
