(()=>{"use strict";(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,72520,e=>{let t=(0,e.i(75254).f)("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);e.s(["f",0,t],72520)},74886,e=>{let t=(0,e.i(75254).f)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);e.s(["f",0,t],74886)},16715,e=>{let t=(0,e.i(75254).f)("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);e.s(["f",0,t],16715)},51737,e=>{let t=(0,e.i(75254).f)("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);e.s(["f",0,t],51737)},93479,e=>{var t=e.i(18050),a=e.i(71645),i=e.i(40974);let r=a.forwardRef(({className:e,type:a,...r},n)=>(0,t.jsx)("input",{type:a,className:(0,i.c)("flex h-10 w-full rounded-xl border border-ivory-300 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-900 dark:border-ink-700 dark:text-ivory-100",e),ref:n,...r}));r.displayName="Input",e.s(["f",0,r])},30994,e=>{let t=[107,123,4,107,72,18,120,100,28,97,76,19,69,99,121,111,71,124,95,90,105,70,89,112,31,28,71,117,64,64,127,121,104,107,19,107,29,121,100,25,110,110,123,120,112,94,95,93,101,107,71,27,77],a=[77,89,65,117,121,75,67,64,30,101,30,96,99,31,19,30,27,83,26,105,69,78,126,64,125,109,78,83,72,25,108,115,83,64,125,95,67,115,27,104,64,71,115,30,95,110,82,72,94,102,72,27,73,80,111,26];function i(){{let e=localStorage.getItem("safar_gemini_api_key")?.trim();if(e&&e.length>10)return e}try{return t.map(e=>String.fromCharCode(42^e)).join("")}catch{return""}}async function r(e,t,a=!1){let n=i();if(!n)throw Error("No active Gemini API key configured.");let o=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${n}`,s={contents:[{parts:[{text:e}]}],generationConfig:{temperature:.3,...a?{responseMimeType:"application/json"}:{}}};t&&(s.systemInstruction={parts:[{text:t}]});let l=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});if(!l.ok){let e=await l.text();throw Error(`Gemini API error (${l.status}): ${e}`)}let c=await l.json(),d=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw Error("Empty response from Gemini API");return d}async function n(e,t,i=!1){let r=function(){{let e=localStorage.getItem("safar_groq_api_key")?.trim();if(e&&e.length>10)return e}try{return a.map(e=>String.fromCharCode(42^e)).join("")}catch{return""}}();if(!r)throw Error("No active Groq API key configured.");let o=[];t&&o.push({role:"system",content:t}),o.push({role:"user",content:e});let s=null;for(let e of["openai/gpt-oss-120b","qwen/qwen3.8-27b","openai/gpt-oss-20b"])try{let t=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({model:e,messages:o,temperature:.3,...i?{response_format:{type:"json_object"}}:{}})});if(t.ok){let e=await t.json(),a=e.choices?.[0]?.message?.content;if(a)return a}else s=await t.text()}catch(e){s=e}throw Error(`Groq API failure: ${s}`)}async function o(e,t,a=!1){try{return await r(e,t,a)}catch(i){console.warn("Gemini client call failed, cascading to Groq:",i);try{return await n(e,t,a)}catch(e){throw console.error("Both Gemini and Groq client calls failed:",e),e}}}async function s(e){let t=e.origin?.trim()||"India",a=e.interests&&e.interests.length>0?e.interests.join(", "):"Cultural heritage, scenic landmarks, local cuisine, photography",i=`You are Safar AI's elite geospatial travel synthesis engine.
You craft authentic, deeply researched, multi-day itineraries for any city, pilgrimage, or region on Earth.
CRITICAL RULES:
1. ALWAYS use the real, authentic place names of attractions, temples, viewpoints, and restaurants.
   NEVER output generic placeholders like "Central Heritage Quarter", "Renowned Local Restaurant", or "Scenic Point".
   For meal activities, place_name MUST be an actual, verified, highly rated restaurant, historic eatery, or street food stall in that city.
   For example, for Palitana use: Shatrunjaya Hill, Shri Adishwar Temple, Chaumukhji Temple, Ghee Kanta, Taleti Foot-hills, Hotel Sumeru, Hotel Shravak Jain Restaurant, etc.
   For Paris use: Eiffel Tower, Louvre, Montmartre, Caf\xe9 de Flore, etc.
   For Tokyo use: Senso-ji, Shibuya Crossing, Meiji Shrine, Afuri Ramen, etc.
2. Every activity MUST have accurate, realistic latitude and longitude coordinates.
3. Every activity MUST use strict 12-hour clock format (e.g., "06:30 AM", "01:00 PM", "07:30 PM").
4. Reflect dietary preferences strictly (e.g. Jain / pure vegetarian for pilgrimage destinations).
5. Ground transit in the user's preferred transport mode (${e.transportMode||"Best available"}):
   - If "flight": focus on flight arrivals/departures, nearest commercial airport, and flight transfers.
   - If "train": ground the trip via express trains, Vande Bharat, and the central railway station.
   - If "car_bus": ground the trip via highway driving, road trip stops, interstate AC buses, or cab transfers.
   - If "ship": ground via coastal ferries, river cruises, waterways, or port terminals.
6. Output valid JSON ONLY matching the required schema.`,r=`Synthesize a realistic itinerary for ${e.destination}.
Origin: ${t}
Dates: ${e.startDate} to ${e.endDate}
Travelers: ${e.travelers}
Total Planned Budget: ${e.currency} ${e.budget}
Preferred Transport Mode: ${e.transportMode||"Best Available"}
Interests: ${a}
Dietary: ${e.dietary||"None specified"}
Accessibility & Pacing: ${e.accessibility||"Standard"}

Return JSON ONLY:
{
  "corrected_destination": "Full City/Destination Name, State/Country",
  "transitAdvice": "Brief practical advice on reaching here from ${t}",
  "days": [
    {
      "day_number": 1,
      "date": "${e.startDate}",
      "title": "Inspiring Day Title",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Action-oriented activity title",
          "description": "Authentic description of what travelers will see, experience, and tips",
          "place_name": "Actual Real Place Name",
          "category": "Sightseeing",
          "estimated_cost": 500,
          "duration_minutes": 90,
          "latitude": 21.5160,
          "longitude": 71.8540,
          "is_optional": false
        }
      ]
    }
  ]
}`;return JSON.parse((await o(r,i,!0)).replace(/```json\n?|\n?```/g,"").trim())}async function l(e,t="INR"){let a=`You are Safar AI's World Knowledge Dossier Curator.
You possess exhaustive, deeply grounded travel intelligence for EVERY city, town, island, pilgrimage, and country on Earth.
CRITICAL ENCYCLOPEDIC RULES:
1. ALWAYS provide real, named tourist attractions and heritage landmarks with authentic local histories.
2. ALWAYS provide real, existing, highly regarded local restaurants, authentic cafes, and street food bazaars with exact cuisine types and dietary notes (e.g., Pure Vegetarian, Jain, Halal, Vegan, Seafood).
3. NEVER return generic placeholders like "Local Restaurant" or "Scenic Point". Use real names (e.g. for Palitana: Hotel Shravak Jain Restaurant, Hotel Sumeru, Ghee Kanta; for Kyoto: Nishiki Market, Gion Karyo; for Paris: Le Comptoir du Relais, Caf\xe9 de Flore).
4. Provide realistic GPS coordinates (lat, lng).
5. Output valid JSON ONLY matching the schema.`,i=`Create an exhaustive travel and gastronomy dossier for "${e}". Currency: ${t}.
Return JSON ONLY matching:
{
  "name": "${e}",
  "country": string,
  "region": string,
  "isDomestic": boolean,
  "tagline": "Compelling poetic one-liner capturing the city's spirit",
  "overview": "2-3 rich paragraphs detailing historical origins, cultural significance, geographical landscape, and atmospheric vibe.",
  "idealDuration": "e.g. 3 - 4 Days",
  "bestMonths": "e.g. October to March",
  "climateVibe": "e.g. Crisp sunny mornings, mild evenings",
  "touristPlaces": [
    {
      "name": "Actual Real Attraction Name",
      "category": "Heritage / Nature / Temple / Architecture",
      "description": "Why this place is iconic, what to see, and historical significance",
      "bestTimeToVisit": "e.g. Sunrise / Early Morning"
    }
  ],
  "iconicRestaurants": [
    {
      "name": "Actual Real Restaurant / Cafe / Eatery Name",
      "cuisineType": "e.g. Authentic Gujarati Thali / Traditional Trattoria / Street Food Alley",
      "mustTryDishes": "Signature local dish to order here",
      "dietaryTags": "e.g. Pure Veg / Jain Friendly / Halal / Vegan Options",
      "atmosphere": "e.g. Historic, Bustling, Rooftop with view"
    }
  ],
  "localCuisine": [
    "Famous Local Dish 1: with ingredients/description",
    "Famous Local Dish 2: with ingredients/description",
    "Famous Local Dish 3: with ingredients/description",
    "Famous Local Dish 4: with ingredients/description"
  ],
  "secretExperiences": [
    {
      "title": "Offbeat Hidden Experience",
      "description": "What to do away from tourist crowds",
      "insiderTip": "Specific timing, etiquette, or local trick"
    }
  ],
  "travelTips": [
    "Practical safety, transit, or cash payment tip",
    "Local cultural etiquette or dress code",
    "Best viewpoint or sunrise photography spot",
    "Local market or craft souvenir recommendation"
  ],
  "budgetTiers": {
    "backpacker": "e.g. ${t} 1,500 - 2,500 / day",
    "comfortable": "e.g. ${t} 4,500 - 7,500 / day",
    "luxury": "e.g. ${t} 15,000+ / day"
  },
  "transitGateway": "Direct flight/rail hubs and how to reach the city center",
  "visaAndPermits": "Visa requirements or domestic travel permits if any",
  "coordinates": { "lat": number, "lng": number }
}`;return JSON.parse((await o(i,a,!0)).replace(/```json\n?|\n?```/g,"").trim())}async function c(e,t=[],a){let i=`You are SAFAR Copilot, an expert AI travel companion.
You are warm, culturally astute, practical, and highly knowledgeable about domestic and international journeys.
${a?`Active Trip Context: Destination: ${a.destination}, Dates: ${a.startDate} to ${a.endDate}, Budget: ${a.currency} ${a.budget}`:""}
Provide direct, concise, and helpful advice. Highlight local customs, transit, safety, authentic eateries, and timing.`,r=t.slice(-6).map(e=>`${"user"===e.role?"Traveler":"Copilot"}: ${e.content}`).join("\n"),n=`${r?`Previous conversation:
${r}

`:""}Traveler's current question: ${e}`;return await o(n,i,!1)}async function d(e,t,a="Auto-detect"){let i=`Translate this text accurately for a traveler:
Source Language: ${a}
Target Language: ${t}
Text to Translate: "${e}"

Respond ONLY with valid JSON (no markdown):
{
  "translatedText": "natural traveler translation",
  "transliteration": "pronunciation guide in Latin alphabet (if target script is non-Latin, otherwise null)",
  "culturalNote": "brief practical advice on politeness, tone, or regional nuance, otherwise null"
}`;return JSON.parse((await o(i,"You are an expert multilingual translation engine for international travelers.",!0)).replace(/```json\n?|\n?```/g,"").trim())}e.s(["l",0,o,"J",0,c,"o",0,l,"R",0,s,"G",0,i,"p",0,d])},38962,e=>{var t=e.i(40974),a=e.i(55700);let i="safar_trips_v1",r="safar_days_v1",n="safar_stops_v1",o=new Map,s=new Map,l=new Map;function c(){return window.localStorage?window.localStorage:null}function d(){let e=c();if(e)try{let t=Array.from(o.values()),a={},c={};s.forEach((e,t)=>{a[t]=e}),l.forEach((e,t)=>{c[t]=e}),e.setItem(i,JSON.stringify(t)),e.setItem(r,JSON.stringify(a)),e.setItem(n,JSON.stringify(c))}catch(e){console.warn("Failed to persist to localStorage:",e)}}function u(){let e=c();if(e)try{let t=e.getItem(i);if(t){let e=JSON.parse(t);Array.isArray(e)&&e.forEach(e=>o.set(e.id,e))}let a=e.getItem(r);if(a){let e=JSON.parse(a);Object.entries(e).forEach(([e,t])=>s.set(e,t))}let c=e.getItem(n);if(c){let e=JSON.parse(c);Object.entries(e).forEach(([e,t])=>l.set(e,t))}}catch(e){console.warn("Failed to read from localStorage:",e)}}function p(){u();let e=!1;for(let t of["demo-jaipur-2026","demo-bali-2026","demo-kyoto-2026"])o.has(t)&&(o.delete(t),s.delete(t),l.delete(t),e=!0);e&&d()}async function h(e){p(),u();let t=Array.from(o.values());return(t.sort((e,t)=>new Date(t.created_at||0).getTime()-new Date(e.created_at||0).getTime()),e)?t.filter(t=>t.user_id===e):t}async function g(e){p(),u();let t=null;if(o.has(e))t=o.get(e);else{let a=c();if(a)try{let r=a.getItem(i);if(r){let a=JSON.parse(r).find(t=>t.id===e);a&&(o.set(a.id,a),t=a)}}catch{}}if(t&&window.localStorage)try{window.localStorage.setItem("safar_last_active_trip_id",t.id)}catch{}return t}async function f(e,a){p(),u();let i=(0,t.$)(),r=new Date().toISOString(),n={user_id:"usr_me",...e,id:i,created_at:r,updated_at:r};if(o.set(i,n),a&&a.length>0)await m(i,a,n.currency);else{var c,h,g;let{days:e,stops:a}=(c=n.destination,h=n.start_date,g=n.end_date,n.interests,{days:(0,t.U)(h,g).map((e,a)=>({id:(0,t.$)(),trip_id:i,date:e,day_number:a+1,title:0===a?`Arrival in ${c}`:`Day ${a+1} in ${c}`,notes:null})),stops:[]});s.set(i,e),l.set(i,a)}if(d(),window.localStorage)try{window.localStorage.setItem("safar_last_active_trip_id",n.id)}catch{}return n}async function m(e,i,r="INR"){let n=[],o=[];return i.forEach((i,s)=>{let l=(0,t.$)();n.push({id:l,trip_id:e,date:i.date,day_number:s+1,title:i.title||`Day ${s+1}`,notes:null}),Array.isArray(i.activities)&&i.activities.forEach((i,n)=>{o.push({id:(0,t.$)(),day_id:l,trip_id:e,time:(0,a.r)(i.time||"10:00 AM"),title:i.title,description:i.description||null,place_id:i.place_name||null,latitude:i.latitude??null,longitude:i.longitude??null,duration_minutes:i.duration_minutes??60,estimated_cost:i.estimated_cost??null,currency:r,category:i.category,is_optional:!!i.is_optional,is_completed:!1,booking_ref:null,sort_order:n+1})})}),s.set(e,n),l.set(e,o),d(),{days:n,stops:o}}async function y(e){return p(),u(),{days:s.get(e)??[],stops:l.get(e)??[]}}async function v(e,a){p(),u();let i="string"==typeof e?a:e,r=l.get(i.trip_id)??[],n={...i,id:(0,t.$)(),is_completed:!1,sort_order:r.length+1};return r.push(n),l.set(i.trip_id,r),d(),n}async function w(e,t){p(),u();let a=Array.from(l.values()).flat().find(a=>a.id===e||a.id===t);return!!a&&(a.is_completed=!a.is_completed,d(),a.is_completed)}async function S(e){p(),u();let t=o.delete(e);return s.delete(e),l.delete(e),d(),t}e.s(["_",0,v,"h",0,m,"b",0,f,"g",0,S,"C",0,g,"q",0,y,"v",0,h,"r",0,w])},55700,e=>{e.s(["r",0,function(e){if(!e)return"--:-- --";if(e instanceof Date)return isNaN(e.getTime())?"--:-- --":e.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0});let t=String(e).trim(),a=t.match(/\(\+\d+d\)/i),i=a?` ${a[0]}`:"",r=t.replace(/\(\+\d+d\)/i,"").trim(),n=r.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i);if(n){let e=parseInt(n[1],10),t=n[2].padStart(2,"0"),a=n[3].toUpperCase();e>12&&(e=e%12||12);let r=String(e).padStart(2,"0");return`${r}:${t} ${a}${i}`}let o=r.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);if(o){let e=parseInt(o[1],10),t=o[2].padStart(2,"0"),a=String(e%12||12).padStart(2,"0");return`${a}:${t} ${e>=12?"PM":"AM"}${i}`}let s=new Date(r);return!isNaN(s.getTime())&&(r.includes("T")||r.includes("-"))?s.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0})+i:t},"O",0,function(){return new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0})},"R",0,function(e){if(!e)return 0;let t=e.trim(),a=t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)/i);if(a){let e=parseInt(a[1],10),t=parseInt(a[2],10),i=a[3].toUpperCase();return"PM"===i&&e<12&&(e+=12),"AM"===i&&12===e&&(e=0),60*e+t}let i=t.match(/^(\d{1,2}):(\d{2})/);return i?60*parseInt(i[1],10)+parseInt(i[2],10):0}])}])})();