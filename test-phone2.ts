import { getExampleNumber } from 'libphonenumber-js/min';
import examples from 'libphonenumber-js/examples.mobile.json' assert { type: 'json' };

const exampleDO = getExampleNumber('DO', examples as any);
const exampleUS = getExampleNumber('US', examples as any);

console.log("DO:", exampleDO ? exampleDO.formatNational() : 'none');
console.log("US:", exampleUS ? exampleUS.formatNational() : 'none');
