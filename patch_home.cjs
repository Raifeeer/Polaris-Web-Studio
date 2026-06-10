const fs = require('fs');

function patchHomeFR(file) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /\{t\("home\.experienceSubtitle"\)\.includes\("tour"\)\s*\?\s*"Our"\s*:\s*t\("home\.experienceSubtitle"\)\.includes\("simple"\)\s*\?\s*"Nuestras"\s*:\s*"Nos"\}/g,
    `{i18n.language.startsWith('en') ? "Our" : i18n.language.startsWith('fr') ? "Nos" : "Nuestras"}`
  );

  content = content.replace(
    /\{t\("home\.experienceSubtitle"\)\.includes\("tour"\)\s*\?\s*"Tours"\s*:\s*t\("home\.experienceSubtitle"\)\.includes\("simple"\)\s*\?\s*"Excursiones"\s*:\s*"Circuits"\}/g,
    `{i18n.language.startsWith('en') ? "Tours" : i18n.language.startsWith('fr') ? "Circuits" : "Excursiones"}`
  );

  content = content.replace(
    /\{ text: t\("home\.experienceSubtitle"\)\.includes\("tour"\)\s*\?\s*"Top Rated"\s*:\s*t\("home\.experienceSubtitle"\)\.includes\("simple"\)\s*\?\s*"Mejor Valorado"\s*:\s*"Mieux Noté", colorClass: "bg-teal-500", icon: <Star className="w-3\.5 h-3\.5" \/> \},/g,
    `{ text: i18n.language.startsWith('en') ? "Top Rated" : i18n.language.startsWith('fr') ? "Mieux Noté" : "Mejor Valorado", colorClass: "bg-teal-500", icon: <Star className="w-3.5 h-3.5" /> },`
  );

  content = content.replace(
    /\{t\("home\.experienceSubtitle"\)\.includes\("tour"\)\s*\?\s*"Frequently"\s*:\s*t\("home\.experienceSubtitle"\)\.includes\("simple"\)\s*\?\s*"Preguntas"\s*:\s*"Questions"\}/g,
    `{i18n.language.startsWith('en') ? "Frequently" : i18n.language.startsWith('fr') ? "Questions" : "Preguntas"}`
  );

  content = content.replace(
    /\}\s*\{t\("home\.experienceSubtitle"\)\.includes\("tour"\)\s*\?\s*"Asked Questions"\s*:\s*t\("home\.experienceSubtitle"\)\.includes\("simple"\)\s*\?\s*"Frecuentes"\s*:\s*"Fréquentes"\}/g,
    `} {i18n.language.startsWith('en') ? "Asked Questions" : i18n.language.startsWith('fr') ? "Fréquentes" : "Frecuentes"}`
  );

  fs.writeFileSync(file, content);
}

patchHomeFR('src/views/Home.tsx');
