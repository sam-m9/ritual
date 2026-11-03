// Recipe pack 3: "Solo weeknight dinners in Austin".
// 20 high-protein dinners built from three rotating proteins, a frozen or batch grain,
// a crunchy raw veg kit and five yogurt sauces made on Sunday. Plus prep and label notes.
// Ratings: A = rotation anchor, B = variety, C = filler or emergency.
// Protein values are estimates from label serving sizes and raw weights (±5 g).

const S1 = 'Sauce 1 · Lemon Garlic Herb yogurt';
const S2 = 'Sauce 2 · Green Chile Zhoug yogurt';
const S3 = 'Sauce 3 · Tahini yogurt';
const S4 = 'Sauce 4 · Masala Raita';
const S5 = 'Sauce 5 · Chili Crisp Garlic yogurt';
const KIT = 'Crunch kit: romaine, carrots, radish, Persian cucumber, quick-pickled onion & jalapeño (Sunday prep)';

const meal = (title, protein, minutes, ingredients, steps, notes) => ({
  cat: 'meal', title, protein, minutes, ingredients, steps, url: '', notes,
});
const prep = (title, minutes, ingredients, steps, notes) => ({
  cat: 'prep', title, protein: '', minutes, ingredients, steps, url: '', notes,
});

export default {
  id: 'austin-2026-11c',
  recipes: [
    // ---------- Mediterranean salads and plates ----------
    meal('Shawarma Chicken Za’atar Chopped Salad', 46, 10, [
      '6 oz Meal Simple by H-E-B Original Rotisserie Chicken, shredded (H-E-B)',
      '1 tbsp extra virgin olive oil (Pantry)',
      '1/2 tsp cumin, 1/2 tsp smoked paprika, 1/4 tsp turmeric, pinch cinnamon, salt (Pantry)',
      '1/2 lemon (H-E-B)',
      KIT,
      '1/4 cup air-fried crispy chickpeas (Sunday prep)',
      '1 tbsp pistachios (Trader Joe’s)',
      'Homemade za’atar (Sunday prep)',
      `1/3 cup ${S3}`,
    ], [
      'Shred the chicken.',
      'Heat olive oil in a pan; add chicken with cumin, smoked paprika, turmeric, cinnamon and salt. Toss 3 minutes until the edges crisp, then squeeze half a lemon over it.',
      'Build a bowl of romaine, carrots, radish, sliced cucumber, pickled onions and jalapeños.',
      'Top with chicken, crispy chickpeas, pistachios and za’atar.',
      'Dress with Sauce 3 thinned with lemon and olive oil.',
    ], 'A · rotation anchor. The spice-crisping step is what turns plain chicken into something you want to eat. Protein: chicken ≈38g + sauce ≈5g + chickpeas ≈3g.'),

    meal('Kofta Turkey Salad Bowl', 46, 12, [
      '7 oz H-E-B Natural Lean Ground Turkey 93% (H-E-B)',
      '1 tsp avocado oil (Pantry)',
      '1 tsp cumin, 1/2 tsp coriander, 1/4 tsp allspice, salt (Pantry)',
      'Chopped parsley (H-E-B)',
      'Romaine (H-E-B)',
      "Trader Joe's Frozen Organic Brown Rice or 10 Minute Farro (Trader Joe's)",
      'Tomato or cucumber, quick-pickled onion (Sunday prep)',
      'Feta, optional (H-E-B / Whole Foods)',
      'Aleppo pepper or chili flakes (Pantry)',
      `1/3 cup ${S1}`,
    ], [
      'Brown turkey hard in avocado oil with cumin, coriander, allspice, salt and parsley. Don’t stir for the first 3 minutes so it crusts.',
      'Fill the bowl half with romaine, half with warmed brown rice or farro.',
      'Add tomato or cucumber, pickled onion and feta if you like.',
      'Finish with Sauce 1 and a pinch of Aleppo or chili flakes.',
    ], 'A · rotation anchor. Adapted from Ethan Chlebowski’s kofta bowl. Turkey needs the crust and the allspice or it tastes like nothing. H-E-B turkey is 23g protein per 4 oz raw, so 7 oz ≈ 40g.'),

    meal('Salmon Crunch Salad', 45, 8, [
      "1 can Trader Joe's Wild Alaskan Pink Salmon, skinless boneless (Trader Joe's)",
      '2 jammy eggs (Sunday prep)',
      '1 tbsp olive oil, lemon juice, black pepper (Pantry)',
      'Chopped quick-pickled jalapeño (Sunday prep)',
      'Romaine, carrot ribbons, radish (H-E-B)',
      'Crispy chickpeas (Sunday prep)',
      `${S1} or ${S3}`,
      'Homemade za’atar (Sunday prep)',
    ], [
      'Flake salmon with olive oil, lemon juice, black pepper and chopped pickled jalapeño.',
      'Pile over romaine, carrot ribbons, radish, crispy chickpeas and halved eggs.',
      'Drizzle with Sauce 1 or Sauce 3 and finish with za’atar.',
    ], 'B · variety. Salmon ≈33g per can + 2 eggs ≈12g. The salmon can was confirmed only via third-party listings; check in store.'),

    meal('Garlic Shrimp & Feta Chopped Salad', 44, 10, [
      "8 oz Trader Joe's Wild Raw Argentinian Red Shrimp, frozen (Trader Joe's)",
      'Olive oil, garlic, smoked paprika, salt (Pantry)',
      "1/2 cup 365 Organic Garbanzo Beans (Whole Foods)",
      '1 oz feta (H-E-B / Whole Foods)',
      KIT,
      '1 lemon (H-E-B)',
      `1/3 cup ${S2}`,
    ], [
      'Thaw shrimp in cold water for 5 minutes and pat dry.',
      'Toss with olive oil, garlic, smoked paprika and salt.',
      'Air fry at 400°F for 5 to 6 minutes. Don’t overcook; they go mushy.',
      'Serve over the crunch kit with chickpeas and feta; finish with Sauce 2 and lemon.',
    ], 'B · variety. Argentinian red shrimp cook fast and taste like lobster. Shrimp protein is conservative (frozen weight includes glaze): ≈27g per 8 oz.'),

    meal('Lentil Farro Plate with Jammy Eggs', 44, 10, [
      "1 cup Trader Joe's Steamed Lentils (Trader Joe's)",
      'Olive oil, garlic, cumin, lemon zest (Pantry / H-E-B)',
      "A little Trader Joe's 10 Minute Farro (Trader Joe's)",
      '3 jammy eggs (Sunday prep)',
      'Radish, cucumber, parsley (H-E-B)',
      `${S1} or ${S3}`,
      "Trader Joe's Crunchy Chili Onion, optional (Trader Joe's)",
    ], [
      'Warm lentils in olive oil with garlic, cumin and lemon zest.',
      'Spoon over a little farro; add halved eggs, radish, cucumber and parsley.',
      'Finish with Sauce 1 or 3, plus chili crisp if you like.',
    ], 'C · filler. Fine and filling, not exciting. Use it when you’re out of meat. Lentils ≈20g per cup + 3 eggs ≈18g.'),

    // ---------- Curry and spice ----------
    meal('Rotisserie Chicken Masala', 44, 12, [
      '6 oz rotisserie chicken, shredded (H-E-B)',
      '1 tsp ghee (H-E-B)',
      "1/2 cup Trader Joe's Masala Simmer Sauce, or homemade masala base (Trader Joe's)",
      'Pinch garam masala, grated ginger (Pantry / H-E-B)',
      'Frozen peas (H-E-B)',
      "Frozen rice (Trader Joe's)",
      'Cilantro and lime (H-E-B)',
      `1/3 cup ${S4}`,
    ], [
      'Warm ghee; add the masala sauce with a splash of water, a pinch of garam masala and grated ginger.',
      'Add shredded chicken and frozen peas; simmer 5 minutes.',
      'Serve over rice with Sauce 4, cilantro and lime.',
    ], 'B · speed exception: the TJ jarred masala contains canola oil. Cleaner path: make a masala base on Sunday (ghee, onion, garlic, ginger, tomato paste, crushed tomatoes, garam masala, splash of cream; 25 min) and freeze in 1/2-cup portions.'),

    meal('Red Curry Shrimp & Tofu', 46, 15, [
      "8 oz Trader Joe's Argentinian Red Shrimp, thawed (Trader Joe's)",
      "4 oz Trader Joe's High Protein Organic Super Firm Tofu, cubed (Trader Joe's)",
      '1 tbsp red curry paste, label checked for sugar (H-E-B)',
      '1 tsp avocado oil (Pantry)',
      '1/2 cup coconut milk (H-E-B)',
      'Splash fish sauce, label checked for sugar (H-E-B)',
      'Frozen broccoli (H-E-B)',
      "Frozen Organic Jasmine Rice (Trader Joe's)",
      'Lime and cilantro (H-E-B)',
      `${S5}, optional`,
    ], [
      'Fry the red curry paste in avocado oil for 1 minute.',
      'Add coconut milk, a splash of fish sauce, cubed tofu and frozen broccoli; simmer 5 minutes.',
      'Add thawed shrimp for the last 3 minutes.',
      'Finish with lime and cilantro over jasmine rice; Sauce 5 on the side for heat and cool together.',
    ], 'A · rotation anchor. Replaces Trader Joe’s Thai Red Curry Sauce, which contains sugar and canola oil.'),

    meal('Turkey Keema with Spinach', 46, 15, [
      '7 oz H-E-B Natural Lean Ground Turkey 93% (H-E-B)',
      'Ghee (H-E-B)',
      'Garlic and ginger (H-E-B)',
      '1 tsp garam masala, 1/2 tsp cumin, 1/2 tsp turmeric, chili powder (Pantry)',
      '1 tbsp tomato paste (H-E-B)',
      'Large handful frozen spinach or peas (H-E-B)',
      "Rice (Trader Joe's frozen or Sunday batch)",
      'Cucumber, quick-pickled onions, lime (Sunday prep / H-E-B)',
      `1/3 cup ${S4}`,
    ], [
      'Brown turkey in ghee.',
      'Add garlic, ginger, garam masala, cumin, turmeric, chili powder and tomato paste.',
      'Stir in frozen spinach (or peas) and a splash of water; cook until thick.',
      'Serve over rice with Sauce 4, cucumber, pickled onions and lime.',
    ], 'A · best meal in the set. Batch a double portion on Sunday; it gets better on day two (then it’s 5 minutes on a weeknight).'),

    meal('Masala Lentils with Fried Eggs', 44, 10, [
      "1 cup Trader Joe's Steamed Lentils (Trader Joe's)",
      '1/3 cup masala base, homemade or TJ jar (flagged)',
      'Frozen spinach (H-E-B)',
      '3 eggs (H-E-B)',
      'Ghee (H-E-B)',
      `1/3 cup ${S4}`,
      "Cilantro, Trader Joe's Crunchy Chili Onion (H-E-B / Trader Joe's)",
    ], [
      'Warm lentils with the masala base and frozen spinach.',
      'Fry eggs in ghee until the edges crisp.',
      'Set the eggs over the lentils; add Sauce 4, cilantro and chili crisp.',
    ], 'B · variety. If you use the TJ Masala jar, it contains canola oil.'),

    meal('Air-Fried Curry Yogurt Chicken Thighs', 48, 5, [
      '8 oz plain boneless skinless chicken thighs, raw (H-E-B / any store)',
      '1/4 cup Greek yogurt, lemon juice, garlic, ginger (marinade)',
      'Garam masala, Kashmiri chili, salt (Pantry)',
      'Rice (frozen or Sunday batch)',
      'Pickled onions, cucumber, cilantro (Sunday prep / H-E-B)',
      `1/3 cup ${S4}`,
    ], [
      'Sunday: marinate thighs in yogurt, lemon juice, garlic, ginger, garam masala, Kashmiri chili and salt. Cook within 2 days.',
      'Air fry at 400°F for 12 to 14 minutes to 175°F internal (thighs are better past 165°F).',
      'Slice over rice with Sauce 4, pickled onions, cucumber and cilantro.',
    ], 'A · rotation anchor. 5 min active + 14 min in the air fryer. Buy plain thighs; skip H-E-B’s pre-marinated thighs (canola oil, sugar in some flavors).'),

    // ---------- Chili crisp and East Asian ----------
    meal('Chili Crisp Tofu Bowl', 43, 6, [
      "8 oz Trader Joe's High Protein Organic Super Firm Tofu, cubed (Trader Joe's)",
      'Avocado oil and salt (Pantry)',
      '1 tsp tamari, 1 tsp unseasoned rice vinegar (Pantry)',
      "1 tbsp Trader Joe's Crunchy Chili Onion (Trader Joe's)",
      "Rice (Trader Joe's frozen)",
      'Smashed cucumber with vinegar and salt (Trader Joe’s / H-E-B)',
      '1 egg, scallion (H-E-B)',
      `Spoon of ${S5}`,
    ], [
      'Cube tofu (no pressing needed), toss with avocado oil and salt, and air fry at 400°F for 12 minutes, shaking once.',
      'Toss hot tofu with tamari, rice vinegar and Crunchy Chili Onion.',
      'Serve over rice with smashed cucumber, a fried egg, scallion and a spoon of Sauce 5.',
    ], 'A · rotation anchor. 6 min active + 12 min in the air fryer. Half a block of TJ High Protein Tofu ≈37g.'),

    meal('Larb-Style Turkey Lettuce Bowl', 46, 12, [
      '8 oz H-E-B Natural Lean Ground Turkey 93% (H-E-B)',
      'Fish sauce, sugar-free label (H-E-B)',
      'Lime juice, chili flakes, sliced shallot (H-E-B / Pantry)',
      'Mint and cilantro (H-E-B)',
      'Rice and romaine leaves (H-E-B)',
      'Cucumber (Trader Joe’s / H-E-B)',
      `${S5} or plain chili crisp`,
    ], [
      'Brown turkey dry and hard.',
      'Season with fish sauce, lime juice, chili flakes and sliced shallot.',
      'Off the heat, add mint and cilantro.',
      'Eat over rice and romaine leaves with cucumber and Sauce 5 or chili crisp.',
    ], 'B · variety.'),

    meal('Turkish Eggs over Lentils', 42, 10, [
      `1/2 cup ${S5}, at room temperature`,
      "3/4 cup Trader Joe's Steamed Lentils (Trader Joe's)",
      'Olive oil and lemon (Pantry / H-E-B)',
      '3 eggs (H-E-B)',
      "Trader Joe's Crunchy Chili Onion melted in a little butter (Trader Joe's)",
      'Aleppo pepper (Pantry)',
    ], [
      'Warm Sauce 5 to room temperature in a shallow bowl.',
      'Warm lentils with olive oil and lemon; spoon beside the yogurt.',
      'Poach or fry the eggs and set them on the yogurt.',
      'Top with Crunchy Chili Onion melted in a little butter, and Aleppo pepper.',
    ], 'B · variety. The Turkish çılbır move.'),

    meal('Crispy Rice Salmon Bowl', 45, 12, [
      "Thawed frozen jasmine or brown rice (Trader Joe's)",
      'Avocado oil (Pantry)',
      "1 can Trader Joe's Wild Alaskan Pink Salmon (Trader Joe's)",
      "Tamari, rice vinegar, Crunchy Chili Onion (Pantry / Trader Joe's)",
      'Cucumber, scallion, 1 egg (H-E-B)',
      `1/3 cup ${S5}`,
    ], [
      'Press thawed rice into a hot pan with avocado oil and leave it 6 minutes to crisp.',
      'Dress salmon with tamari, rice vinegar and chili crisp.',
      'Top the crispy rice with salmon, cucumber, scallion and a fried egg; Sauce 5 underneath.',
    ], 'B · variety. The viral salmon rice bowl without the mayo or sriracha sugar.'),

    meal('Chili Crisp Beef Red Lentil Pasta', 49, 15, [
      "3 oz dry Trader Joe's Organic Red Lentil Sedanini (Trader Joe's)",
      '5 oz 93/7 lean ground beef (H-E-B)',
      'Garlic, 1 tbsp tomato paste (H-E-B)',
      "Trader Joe's Crunchy Chili Onion (Trader Joe's)",
      'Lemon and parsley (H-E-B)',
      `Dollop of ${S5}`,
    ], [
      'Boil pasta for 5 to 6 minutes; don’t overcook. Save a splash of pasta water.',
      'Brown beef with garlic, tomato paste, chili crisp and a splash of pasta water.',
      'Toss with the pasta, add lemon and parsley, and dollop Sauce 5.',
    ], 'C · once in a while. High protein per calorie, but lentil pasta tastes like lentils.'),

    // ---------- Tex-Mex, Austin style ----------
    meal('Green Chile Beef Bowl', 46, 12, [
      '7 oz 93/7 lean ground beef (H-E-B)',
      '1 tbsp tomato paste (H-E-B)',
      'Cumin, smoked paprika, cayenne, salt (Pantry)',
      'Romaine and rice (H-E-B / Trader Joe’s)',
      'Quick-pickled jalapeños, raw red onion, radish (Sunday prep / H-E-B)',
      `1/3 cup ${S2}`,
      'Lime; small handful tortilla chips, label checked for oil (H-E-B)',
    ], [
      'Brown beef with tomato paste, cumin, smoked paprika, cayenne and salt.',
      'Serve over romaine and rice with pickled jalapeños, raw red onion and radish.',
      'Finish with Sauce 2, lime and a few tortilla chips for crunch.',
    ], 'A · rotation anchor. Ethan Chlebowski’s high-protein beef bowl spice set. Many chips use sunflower or canola oil; check the bag.'),

    meal('Chipotle Tomato Rotisserie Chicken Bowl', 44, 12, [
      '6 oz rotisserie chicken, shredded (H-E-B)',
      '1/2 cup crushed tomatoes (H-E-B)',
      '1 tsp chipotle powder, cumin, garlic, salt (Pantry)',
      'Rice (Trader Joe’s frozen)',
      'Pickled onion, radish, cilantro, lime (Sunday prep / H-E-B)',
      `1/3 cup ${S2}`,
    ], [
      'Simmer crushed tomatoes with chipotle powder, cumin, garlic and salt for 4 minutes.',
      'Add shredded chicken and cook until saucy and clinging.',
      'Serve over rice with pickled onion, radish, cilantro, Sauce 2 and lime.',
    ], 'B · variety. Uses chipotle powder instead of canned chipotles in adobo, which commonly contain sugar.'),

    meal('Shrimp Taco Bowl', 46, 12, [
      "8 oz Trader Joe's Argentinian Red Shrimp (Trader Joe's)",
      'Chili powder, cumin, garlic, salt (Pantry)',
      '1/2 cup black beans, cumin, lime (H-E-B)',
      'Rice and romaine, cabbage or radish (H-E-B)',
      'Quick-pickled jalapeño (Sunday prep)',
      '1 oz cotija (H-E-B)',
      `1/3 cup ${S2}`,
    ], [
      'Season shrimp with chili powder, cumin, garlic and salt; air fry 5 to 6 minutes at 400°F.',
      'Warm black beans with cumin and lime.',
      'Serve over rice and romaine with cabbage or radish, pickled jalapeño, cotija and Sauce 2.',
    ], 'B · variety.'),

    // ---------- Pure shortcuts ----------
    meal('H-E-B Tikka Masala Bowl, Boosted', '', 4, [
      'Meal Simple by H-E-B Chicken Tikka Masala Bowl (H-E-B)',
      '3 oz rotisserie chicken, shredded (H-E-B)',
      `1/3 cup ${S4}`,
      'Cucumber, cilantro, lime (H-E-B)',
    ], [
      'Microwave the bowl per the package.',
      'Stir in the extra shredded chicken while hot.',
      'Add Sauce 4, cucumber, cilantro and lime.',
    ], 'C · emergency, speed exception: canola oil in the sauce. Bowl protein not verified (read the label); add ≈19g from the extra chicken and ≈6g from the sauce. The “got home at 8:30” meal.'),

    meal('Trader Joe’s Shawarma Thigh Plate', 48, 5, [
      "8 oz Trader Joe's Shawarma Chicken Thighs (Trader Joe's)",
      "Rice or 10 Minute Farro (Trader Joe's)",
      KIT,
      'Crispy chickpeas (Sunday prep)',
      `1/3 cup ${S3} or ${S1}`,
      `Spoon of ${S2}`,
      'Homemade za’atar (Sunday prep)',
    ], [
      'Air fry the thighs at 400°F for 12 to 14 minutes, then slice.',
      'Plate with rice or farro, the crunch kit, pickled onions and crispy chickpeas.',
      'Add Sauce 3 plus a spoon of Sauce 2 for heat; za’atar on top.',
    ], 'A · speed exception: soybean oil appears only as the carrier for annatto coloring. 5 min active + 12–14 min air fryer. Cook the whole package and use the rest in the za’atar salad or masala later in the week.'),

    // ---------- Sauces & prep ----------
    prep('Sauce 1 · Lemon Garlic Herb Yogurt', 5, [
      '2 cups Greek yogurt (365 Organic Whole Milk, Whole Foods, or TJ Nonfat)',
      'Zest and juice of 1 lemon',
      '1 small garlic clove, grated',
      '3 tbsp chopped dill and parsley (or 1 tbsp dried dill)',
      '2 tbsp extra virgin olive oil',
      '3/4 tsp kosher salt, black pepper',
    ], ['Stir everything together and jar it.'], 'Keeps 5–6 days; makes 4–6 servings. Garlic intensifies over days, so start lighter. For: kofta turkey, salmon crunch, shrimp & feta, lentil farro, shawarma thighs.'),

    prep('Sauce 2 · Green Chile Zhoug Yogurt', 5, [
      '1.5 cups Greek yogurt',
      '1 packed cup cilantro with stems',
      '1 jalapeño (seeded for less heat)',
      '1 garlic clove, juice of 2 limes',
      '1/2 tsp ground cumin, 1/4 tsp ground cardamom',
      '2 tbsp avocado oil, 3/4 tsp salt',
    ], ['Blend until smooth and jar it.'], 'Keeps 5 days (cilantro dulls after that). Replaces TJ Zhoug (canola oil). For: shawarma salad, shrimp & feta, green chile beef, chipotle chicken, shrimp tacos, shawarma thighs.'),

    prep('Sauce 3 · Tahini Yogurt', 5, [
      '1 cup Greek yogurt',
      '1/3 cup tahini',
      'Juice of 1 lemon, 1 grated garlic clove',
      '1/2 tsp salt',
      '3–4 tbsp cold water',
    ], ['Whisk together, thinning with cold water to drizzle consistency.', 'Finish servings with sumac or homemade za’atar.'], 'Keeps 7 days. For: shawarma salad, salmon crunch, lentil farro, crispy rice salmon, shawarma thighs.'),

    prep('Sauce 4 · Masala Raita Base', 7, [
      '1.5 cups Greek yogurt',
      '1 tsp cumin seed toasted in 1 tsp ghee',
      '1/2 tsp garam masala, 1 tsp grated ginger',
      'Juice of 1 lime, 2 tbsp chopped cilantro or mint',
      '1/2 tsp salt, pinch Kashmiri or regular chili powder',
    ], ['Toast cumin seed in ghee until fragrant; stir into the yogurt with everything else.', 'Add grated cucumber per serving, not to the jar, or it goes watery.'], 'Keeps 6–7 days. For: chicken masala, turkey keema, masala lentils, curry yogurt thighs, H-E-B tikka bowl.'),

    prep('Sauce 5 · Chili Crisp Garlic Yogurt', 3, [
      '1.5 cups Greek yogurt',
      '1 grated garlic clove, juice of 1/2 lemon, 1/2 tsp salt',
      "At serving: 1 tbsp Trader Joe's Crunchy Chili Onion + squeeze of lemon",
    ], ['Store plain. At serving, spoon on Crunchy Chili Onion and a squeeze of lemon.'], 'Keeps 7 days. Rescues anything. For: red curry shrimp, chili crisp tofu, larb turkey, Turkish eggs, crispy rice salmon, red lentil pasta.'),

    prep('Homemade Za’atar', 3, [
      '2 tbsp dried thyme',
      '1 tbsp toasted sesame seeds',
      '1 tbsp ground sumac',
      '1/2 tsp salt',
    ], ['Mix and store in a jar.'], 'Replaces Trader Joe’s blend, which third-party labels show with sunflower oil.'),

    prep('Sunday Batch Prep (about 90 min)', 90, [
      '2 cans 365 Organic Garbanzo Beans (Whole Foods)',
      '1 red onion, 2 jalapeños, radishes + 1/2 cup vinegar, 1/2 cup water, 1 tsp salt',
      '6 eggs',
      'Yogurt sauce ingredients',
      '1 lb ground turkey, 1 rotisserie chicken',
      'Romaine, carrots, radish',
    ], [
      '0:00 Start basmati rice (2 cups dry), or skip and rely on frozen rice.',
      '0:05 Drain and dry chickpeas; toss with olive oil, salt, cumin; air fry at 390°F for 15–18 min, shaking twice. Cool fully before jarring.',
      '0:10 Quick pickles: slice red onion, jalapeños and radishes into a jar; cover with vinegar, water and salt. No sugar needed. Ready in 30 min, good for 2 weeks.',
      '0:15 Boil 6 eggs for 7 minutes, then ice bath.',
      '0:20 Make the sauces your week needs (about 20 min with a blender for Sauce 2).',
      '0:40 Cook a double batch of Turkey Keema and portion it. Brown the other half pound with kofta spices, or leave raw for Monday (use raw ground meat within 1–2 days).',
      '0:55 Wash and chop romaine, carrots and radish; store in containers lined with paper towel.',
      '1:05 Shred the rotisserie chicken; refrigerate in two portions.',
      '1:10 Mix za’atar, toast nuts, clean up.',
    ], 'Crispy chickpeas soften by day 3; re-crisp 3 min in the air fryer. Storage: raw ground meat 1–2 days, cooked meat 3–4 days (FoodSafety.gov).'),

    prep('Weeknight Template (10–15 min)', 15, [
      'Frozen or batch rice',
      'One protein',
      'Crunch kit + 1 cucumber',
      'This week’s yogurt sauce + a contrasting element',
      'Crunch and herbs to finish',
    ], [
      'Microwave frozen rice or reheat batch rice (3 min). Start this first.',
      'Heat the protein: crisp shredded chicken, brown turkey or beef, or air fry tofu, shrimp or thighs.',
      'While it cooks, build the bowl from the crunch kit and cut one cucumber.',
      'Sauce: one spoonful of yogurt sauce plus a contrast (chili crisp, lemon, pickle brine).',
      'Finish: crunch (chickpeas, nuts, Everything but the Bagel, chili crisp solids) and herbs.',
    ], 'Formula: base + protein + crunch kit + sauce + finish. The finish (acid, crunch, fresh herb) is what kills blandness.'),

    prep('Sample Week', 0, [
      'Mon · Kofta Turkey Salad Bowl + Sauce 1',
      'Tue · Turkey Keema with Spinach (reheated) + Sauce 4',
      'Wed · Chili Crisp Tofu Bowl + Sauce 5',
      'Thu · Shawarma Chicken Za’atar Chopped Salad + Sauce 3',
      'Fri · Trader Joe’s Shawarma Thigh Plate + Sauces 3 and 2',
    ], [
      'Next week keep the structure and swap flavors: Green Chile Beef Bowl for the kofta bowl, Red Curry Shrimp & Tofu for the tofu bowl, Chipotle Chicken for the za’atar salad.',
    ], 'Anchors: Turkey Keema, Kofta Turkey, Shawarma Salad, Chili Crisp Tofu, Green Chile Beef, Red Curry Shrimp & Tofu, Curry Yogurt Thighs, Shawarma Thigh Plate. Leftovers cover Turkish Eggs or Red Curry as a swap.'),

    prep('Label Check: What to Skip', 0, [
      "Trader Joe's Thai Style Red Curry Sauce: sugar, canola oil",
      "Trader Joe's Zhoug: canola oil (make Sauce 2 instead)",
      "Trader Joe's Garlic Spread Dip (toum): canola oil first",
      "Trader Joe's Za'atar blend: sunflower oil per third-party labels",
      "Trader Joe's Grilled Chicken Strips: current label lists dextrose; read the bag",
      "Trader Joe's seasoned frozen rice: sunflower/soybean oil (plain jasmine and brown are fine)",
      "H-E-B Meat Market marinated chicken thighs: canola oil, sugar in some flavors",
      'H-E-B Italian Herb and Uncle Chris’ rotisserie chickens: sugar (Original or Natural are fine)',
      'H-E-B Mi Tienda / sliced pickled jalapeños: sugar + seed oil (quick pickle your own)',
      'Canned chipotles in adobo: commonly contain sugar (chipotle powder instead)',
      '365 non-Greek whole milk yogurt: only 6g protein (get 365 Organic Greek)',
    ], [
      'Speed exceptions that are OK sometimes: TJ Shawarma Thighs (soybean oil only as color carrier), TJ Masala Simmer Sauce (canola mid-list), H-E-B Meal Simple Tikka Masala Bowl (canola in sauce), H-E-B 17g Protein Greek Yogurt (added milk protein concentrate).',
    ], 'Verified against store sites and label databases; store-level stock in Austin wasn’t checked. Note: some earlier cookbook recipes use canned chipotles in adobo and TJ chimichurri; swap if you’re avoiding sugar and seed oils.'),
  ],

  // Weekly list from the report (dedupes against your existing staples by exact name).
  groceries: [
    'H-E-B Natural Lean Ground Turkey 93%, 1 lb (H-E-B)',
    'Meal Simple Original or H-E-B Natural Rotisserie Chicken (H-E-B)',
    'Plain boneless skinless chicken thighs, 1 lb (H-E-B)',
    'Eggs, 1 dozen (H-E-B)',
    'Romaine hearts, 3-pack (H-E-B)',
    'Carrots, 1 lb (H-E-B)',
    'Radishes, 1 bunch (H-E-B)',
    'Red onions ×2 and jalapeños ×3 (H-E-B)',
    'Lemons ×4 and limes ×4 (H-E-B)',
    'Garlic and fresh ginger (H-E-B)',
    'Cilantro, parsley, dill or mint (H-E-B)',
    'Frozen chopped spinach and broccoli, single-ingredient (H-E-B)',
    'Feta or cotija block (H-E-B)',
    'Ghee (H-E-B)',
    'Tomato paste and crushed tomatoes (H-E-B)',
    'Coconut milk (H-E-B)',
    'Red curry paste, no sugar (H-E-B)',
    'Fish sauce, no sugar (H-E-B)',
    'Unseasoned rice vinegar (H-E-B)',
    'Distilled or apple cider vinegar for pickling (H-E-B)',
    'Tahini (H-E-B)',
    'Spices: cumin, coriander, smoked paprika, turmeric, garam masala, allspice, cardamom, chipotle powder, sumac, dried thyme, Aleppo (Pantry)',
    "Trader Joe's Shawarma Chicken Thighs (Trader Joe's)",
    "Trader Joe's Steamed Lentils (Trader Joe's)",
    "Trader Joe's 10 Minute Farro (Trader Joe's)",
    "Trader Joe's Crunchy Chili Onion (Trader Joe's)",
    "Trader Joe's Nonfat Plain Greek Yogurt 32 oz (Trader Joe's)",
    "Wild Alaskan Pink Salmon, skinless boneless, 2 cans (Trader Joe's)",
    "Wild Raw Argentinian Red Shrimp, 1 lb frozen (Trader Joe's)",
    "Organic Red Lentil Sedanini (Trader Joe's)",
    "Everything but the Bagel Seasoning (Trader Joe's)",
    "Pistachios or almonds (Trader Joe's)",
    '365 Organic Greek Whole Milk Yogurt Plain 32 oz (Whole Foods)',
    '365 Organic Garbanzo Beans, 2 cans (Whole Foods)',
  ],
};
