const path = require("path");
const index_cjs= process.argv[2];
const cjs = require(path.join(process.cwd(), index_cjs));

let wrapper = `import cjs from "./index.cjs";`;
for (let name in cjs) {
    wrapper += `\nexport const ${name} = cjs.${name};`
}
console.log(wrapper);
