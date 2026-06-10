const fs = require('fs');

function updateName(file, id, newName) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (content.excursions && content.excursions[id]) {
    content.excursions[id].name = newName;
  }
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

function updateLocales(file, map) {
    for (const [id, name] of Object.entries(map)) {
        updateName(file, id, name);
    }
}

const en = {
  "exc-atv": "Wild ATV Jungle Ride",
  "exc-buggy": "Buggy Off-Road Rush",
  "exc-caballo": "Horseback Sunset Trail",
  "exc-glassboat": "Crystal Boat Ocean Safari",
  "exc-jetski": "Jet Ski Wave Blast",
  "exc-parasailing": "Parasailing Sky High",
  "exc-partyboat": "Catamaran Party Cruise",
  "exc-speedboat": "Speedboat Thrill Ride",
  "exc-saona": "Saona Island Paradise",
  "exc-delfines": "Swim with Dolphins",
  "exc-catalina": "Catalina Yacht & Snorkel",
  "exc-santodomingo": "Santo Domingo Colonial Tour"
};

const es = {
  "exc-atv": "ATV Salvaje por la Jungla",
  "exc-buggy": "Buggy Off-Road Extremo",
  "exc-caballo": "Cabalgata al Atardecer",
  "exc-glassboat": "Safari en Bote de Cristal",
  "exc-jetski": "Jet Ski a toda Velocidad",
  "exc-parasailing": "Parasailing en las Alturas",
  "exc-partyboat": "Catamarán Party Cruise",
  "exc-speedboat": "Lancha Rápida Extrema",
  "exc-saona": "Isla Saona Paraíso",
  "exc-delfines": "Nada con Delfines",
  "exc-catalina": "Yate y Snorkel en Catalina",
  "exc-santodomingo": "Tour Colonial Santo Domingo"
};

const fr = {
  "exc-atv": "ATV Sauvage en Forêt",
  "exc-buggy": "Buggy Off-Road Extrême",
  "exc-caballo": "Balade à Cheval au Coucher du Soleil",
  "exc-glassboat": "Safari en Bateau à Fond de Verre",
  "exc-jetski": "Jet Ski Vagues & Vitesse",
  "exc-parasailing": "Parasailing Haut dans le Ciel",
  "exc-partyboat": "Catamaran Party Cruise",
  "exc-speedboat": "Sensations en Hors-Bord",
  "exc-saona": "Île Saona Paradis",
  "exc-delfines": "Nager avec les Dauphins",
  "exc-catalina": "Yacht & Snorkeling à Catalina",
  "exc-santodomingo": "Tour Colonial de Saint-Domingue"
};

updateLocales('./src/locales/en.json', en);
updateLocales('./src/locales/es.json', es);
updateLocales('./src/locales/fr.json', fr);
