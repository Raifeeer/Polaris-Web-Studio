const fs = require('fs');
function safeJSONParse(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /const parsed = JSON\.parse\(saved\);/g,
    `let parsed = null; try { parsed = JSON.parse(saved); } catch(e) { console.error(e); }`
  );
  content = content.replace(
    /const cart = JSON\.parse\(saved\);/g,
    `let cart = null; try { cart = JSON.parse(saved); } catch(e) { console.error(e); }`
  );
  fs.writeFileSync(filename, content);
}
safeJSONParse('src/views/Checkout.tsx');
safeJSONParse('src/components/Navbar.tsx');
safeJSONParse('src/views/TourDetail.tsx');
safeJSONParse('src/views/Cart.tsx');
