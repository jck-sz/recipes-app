$API_BASE = "http://localhost:3000"

Write-Host "Fixing Polish character encoding in all recipes..." -ForegroundColor Green

# Recipe updates with proper Polish characters
$recipeUpdates = @(
    @{
        id = 1
        title = "Owsianka z truskawkami i orzechami włoskimi"
        description = "Zdrowa i bezpieczna owsianka Low FODMAP na dobry początek dnia. Kremowa owsianka z mleka ryżowego z dodatkiem świeżych truskawek i orzechów włoskich. Porcja: 1 osoba | Czas: 8 minut | Kalorie: 385 kcal. Przygotowanie: W średnim rondelku zagotować mleko ryżowe ze szczyptą soli, dodać płatki owsiane, gotować na wolnym ogniu 3-4 minuty często mieszając. Owsianka powinna być kremowa, nie za gęsta. Zdjąć z ognia, dodać olej kokosowy. Truskawki umyć, pokroić na ćwiartki. Orzechy posiekać na mniejsze kawałki. Owsiankę przełożyć do miski, na wierzch ułożyć truskawki, posypać orzechami, opcjonalnie posypać cynamonem."
    },
    @{
        id = 2
        title = "Placuszki bananowe Low FODMAP z żółtek"
        description = "Bezglutenowe placuszki bananowe bez białka kurzego, idealne na śniadanie Low FODMAP. Porcja: 1 osoba | Czas: 15 minut. Przygotowanie: Wymieszaj mielone siemię lniane z wodą i odstaw na 5 minut. Rozgnieć banana widelcem, dodaj żółtka, mąkę, sól, siemię lniane i opcjonalne przyprawy. Wymieszaj dokładnie do uzyskania dość gęstej masy. Na dobrze rozgrzanej nieprzywierającej patelni smaż małe placuszki na małym ogniu ok. 2 minuty z każdej strony. Podaj z jogurtem kokosowym. Wskazówki: Nie rób ich zbyt dużych – małe placuszki są łatwiejsze do odwrócenia. Jeśli ciasto za rzadkie, dosyp mąki. Można dodać borówki (do 40g) lub pokrojone kiwi."
    },
    @{
        id = 3
        title = "Gulasz wołowy z ryżem"
        description = "Syte i bezpieczne danie Low FODMAP na główny posiłek dnia. Porcje: 3 osoby | Czas: 1 godzina 20 minut | Kalorie: 425 kcal/porcja. Przygotowanie: Wołowinę pokroić w kostki 3cm, ziemniaki i marchew w kostki, paprykę w paski, pomidory w ósemki. W ciężkim garnku rozgrzać olej rzepakowy, wołowinę przyprawić solą i pieprzem, smażyć porcjami 3-4 min z każdej strony do zarumienienia. W tym samym garnku dodać olej czosnkowy, smażyć marchew 4 min, paprykę 3 min, koncentrat pomidorowy 1 min. Dodać przyprawy. Wołowinę wrócić do garnka, dodać pomidory, zalać bulionem, dodać liście laurowe. Dusić pod przykryciem 40 min, dodać ziemniaki, dusić jeszcze 10 min. Równolegle ugotować ryż brązowy. Podawać: 200ml gulaszu + 50g ryżu na porcję."
    },
    @{
        id = 4
        title = "Gulasz z indyka"
        description = "Lekki gulasz z indyka Low FODMAP. Porcje: 2-3 osoby | Czas: 50 minut | Kalorie: 380 kcal/porcja. Przygotowanie: Indyka pokroić w kostki 2,5cm, ziemniaki w kostki 2cm, marchew w ukośne plastry 1,5cm, paprykę w kawałki (max 80g!), pomidor sparzyć, obrać, pokroić w ósemki. W garnku rozgrzać olej rzepakowy, indyka przyprawić solą i pieprzem, smażyć porcjami 2-3 min z każdej strony do zarumienienia. W tym samym garnku dodać olej czosnkowy, smażyć marchew 3 min, paprykę 2 min, koncentrat pomidorowy 1 min. Dodać przyprawy: paprykę słodką, majeranek, tymianek. Indyka wrócić do garnka, dodać pomidor, zalać bulionem wołowym, dodać liście laurowe. Dusić pod przykryciem 15 min, dodać ziemniaki, dusić jeszcze 10 min. Podawać: 200g gulaszu na osobę z ryżem, quinoą lub chlebem bezglutenowym."
    },
    @{
        id = 5
        title = "Mielone kotlety z jagnięciny z quinoą i marchewką"
        description = "Aromatyczne kotlety z jagnięciny Low FODMAP z quinoą i duszoną marchewką. Porcje: 2 osoby (4 kotlety) | Czas: 40 minut | Kalorie: 440 kcal/porcja. Przygotowanie kotletów: Mieloną jagnięcinę wymieszać z żółtkiem, bułką tartą bezglutenową, rozmarynem, tymiankiem, solą i pieprzem. Nie mieszać za długo. Uformować 4 kotlety (100g każdy), schłodzić 15 min. Quinoa: Przepłukać, ugotować w 250ml wody z solą 12 min pod przykryciem, odstawić na 5 min, rozgarnąć widelcem. Marchewka: Pokroić w ukośne plastry 1,5cm, smażyć na oliwie 3 min, dodać bulion i oregano, dusić pod przykryciem 10-12 min, na końcu sok z cytryny. Smażenie kotletów: Na średnim ogniu z olejem rzepakowym, 5 min z pierwszej strony, 4-5 min z drugiej, odpoczynek 2 min. Podawanie: quinoa na talerzu, obok marchewka, na wierzchu 2 kotlety, polać sokiem z cytryny."
    }
)

function Update-Recipe {
    param(
        [int]$Id,
        [string]$Title,
        [string]$Description
    )
    
    $body = @{
        title = $Title
        description = $Description
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/recipes/$Id" -Method PUT -Body $body -ContentType "application/json; charset=utf-8"
        Write-Host "Updated recipe $Id`: $Title" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to update recipe $Id`: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

# Update first batch of recipes
foreach ($recipe in $recipeUpdates) {
    Update-Recipe -Id $recipe.id -Title $recipe.title -Description $recipe.description
}

# Continue with remaining recipes
$moreRecipeUpdates = @(
    @{
        id = 6
        title = "Wołowina duszona z quinoą i fasolką"
        description = "Pożywne danie z wołowiną, quinoą i fasolką szparagową Low FODMAP. Porcje: 2 duże porcje | Czas: 35 minut | Kalorie: 435 kcal/porcja. Przygotowanie: Wołowinę pokroić w paski 2cm x 5cm w poprzek włókien, marchew w ukośne plastry 1cm, quinoę przepłukać, fasolkę rozmrozić. Podsmażenie wołowiny: Na średnim ogniu z olejem rzepakowym, przyprawić solą i pieprzem, smażyć paski porcjami 2-3 min z każdej strony do zarumienienia. Warzywa: W tej samej patelni dodać masło klarowane, smażyć marchew 3 min, koncentrat pomidorowy 1 min, dodać tymianek, majeranek, liście laurowe. Duszenie: Wołowinę wrócić do patelni, zalać bulionem, dusić pod przykryciem 10 min, dodać fasolkę w ostatnich 5 min. Quinoa: Równolegle ugotować w 250ml wody z solą 12 min pod przykryciem, odstawić 5 min, rozgarnąć. Podawanie: 200g wołowiny z warzywami + 50g quinoa (sucha) na porcję."
    },
    @{
        id = 7
        title = "Koktajl z melona LOW FODMAP"
        description = "Orzeźwiający koktajl z melona kantalupa Low FODMAP. 255 kcal. Przygotowanie: Melona obrać ze skórki i pokroić na kawałki. Orzechy lekko posiekać. Melon, mleko owsiane i wodę wrzucić do blendera, miksować 45 sekund do gładkości. Dodać posiekane orzechy na wierzch. Podawać schłodzone."
    },
    @{
        id = 8
        title = "Sałatka owocowa z orzechami LOW FODMAP"
        description = "Kolorowa sałatka owocowa Low FODMAP z orzechami włoskimi. 290 kcal | Czas: 8 minut. Przygotowanie owoców (5 min): Truskawki umyć, usunąć szypułki, pokroić na połówki. Melon: usunąć pestki i skórkę, pokroić w kostki 1,5cm. Kiwi obrać, pokroić w plastry, potem każdy na ćwiartki. Wszystkie owoce skropić sokiem z cytryny. Przygotowanie orzechów (1 min): Orzechy włoskie posiekać na większe kawałki, można lekko podprażyć na suchej patelni 30 sekund. Mieszanie i podawanie (2 min): W misce delikatnie wymieszać wszystkie owoce, polać rozpuszczonym olejem kokosowym, delikatnie wymieszać. Posypać orzechami, udekorować listkami mięty. Podawać od razu lub schłodzić 10 minut. Wartości odżywcze: 290 kcal, 5g białka, 12g tłuszczów, 42g węglowodanów, 7g błonnika, 160% dziennego zapotrzebowania na witaminę C."
    },
    @{
        id = 9
        title = "Smoothie bananowo-truskawkowe LOW FODMAP"
        description = "Kremowe smoothie z niedojrzałym bananem i truskawkami Low FODMAP. 280 kcal | Czas: 3 minuty. BARDZO WAŻNE - wybór banana: niedojrzały (żółty z zielonymi końcówkami), twardy, nie miękki. Dojrzały banan z brązowymi plamkami to wysokie FODMAP! Przygotowanie składników (1 min): Banan obrać, pokroić na kawałki. Truskawki: jeśli świeże - umyć i usunąć szypułki. Olej kokosowy: jeśli stały, można lekko podgrzać. Miksowanie (2 min): Do blendera włożyć w kolejności: mleko owsiane (na dole), pokrojony banan, truskawki, olej kokosowy, cynamon. Miksować 60-90 sekund do gładkiej konsystencji. Podawanie: Przelać do wysokiej szklanki, można udekorować półplastrami truskawek, podawać z słomką. Wartości odżywcze: 280 kcal, 6g białka, 8g tłuszczów, 48g węglowodanów, 6g błonnika, 420mg potasu."
    },
    @{
        id = 10
        title = "Indyk z quinoą i bakłażanem LOW FODMAP"
        description = "Aromatyczne danie z indykiem, quinoą i pieczonym bakłażanem Low FODMAP. 405 kcal | 30 min. Piekarnik i bakłażan (20 min): Piekarnik nagrzać do 200°C. Bakłażana pokroić w kostki 2cm, posolic i zostawić 10 min (wypuści goryczę). Osuszyć ręcznikiem, wymieszać z olejem oliwkowym + oregano + sól. Rozłożyć na blasze, piec 15-18 min do zarumienienia (przewrócić po 10 min). Quinoa (12 min równolegle): Quinoę przepłukać, ugotować w 100ml wody z solą 12 min pod przykryciem, odstawić na 5 min. Indyk (6 min): Indyka pokroić w kostki, przyprawić. Smażyć na oleju rzepakowym 5-6 min. Dodać oregano i bazylię. Połączenie (3 min): Dodać bakłażana do indyka. Skropić cytryną, wymieszać. Podawać z quinoą."
    }
)

foreach ($recipe in $moreRecipeUpdates) {
    Update-Recipe -Id $recipe.id -Title $recipe.title -Description $recipe.description
}

# Final batch of recipes
$finalRecipeUpdates = @(
    @{
        id = 11
        title = "Łosoś z ziemniakami i szpinakiem LOW FODMAP"
        description = "Eleganckie danie z łososiem, ziemniakami i szpinakiem Low FODMAP. 415 kcal | 25 min. Przygotowanie ziemniaków (15 min): Ziemniaki obrać i pokroić na kawałki 3-4cm. Wrzucić do osolonej wrzącej wody, gotować 12-15 minut do miękkości. Odsączyć i lekko rozgnieść widelcem. Doprawić solą, pieprzem i odrobiną oliwy. Przygotowanie łososia (8 min): Łosoś osuszyć ręcznikiem papierowym. Przyprawić solą i pieprzem z obu stron. Skropić sokiem z cytryny, zostawić na 5 min. Rozgrzać patelnię na średnim ogniu. Dodać 1/2 łyżki oliwy lub masła klarowanego. Smażyć łososia 3-4 minuty z pierwszej strony. Odwrócić, smażyć 2-3 minuty z drugiej strony. Wnętrze powinno być lekko różowe. Szpinak (3 min): W tej samej patelni (po łososiu) dodać resztę oliwy. Wrzucić umyty szpinak (może być mokry). Zeszklić na wysokim ogniu 1-2 minuty. Dodać szczyptę soli i pieprzu. Dodać posiekany koper na końcu. Podawanie: Na talerz ułożyć ziemniaki. Obok położyć łososia. Wokół rozłożyć zeszklony szpinak. Polać sokiem z cytryny. Posypać świeżym koperkiem. Bogaty w omega-3 z łososia!"
    },
    @{
        id = 12
        title = "Omlet z żółtek z cukinią i szpinakiem LOW FODMAP"
        description = "Lekki omlet z żółtek bez białka kurzego z warzywami Low FODMAP. 385 kcal | 15 min. Przygotowanie żelkowanego siemienia: Siemię + woda wymieszać, odstawić na 5 min (zrobi się żelowate). Żółtka + żel z siemienia ubić razem. Przygotowanie składników (3 min): Żółtka ostrożnie oddzielić od białek (białka zachować na inne cele). Żółtka ubić widelcem z solą i pieprzem. Cukinię pokroić w kostki 0,5cm. Szpinak umyć i osuszyć. Warzywa (4 min): Na patelni rozgrzać połowę oleju. Cukinię smażyć 2-3 minuty do lekkiego zrumienienia. Dodać szpinak, smażyć 1 minutę do zwiędnięcia. Przełożyć warzywa na talerz, przyprawić solą. Omlet z żółtek (3 min): Tę samą patelnię wyczyścić, rozgrzać z resztą oleju. Wlać żółtka - będą gęstsze niż zwykłe jajka. Po 30 sekundach dodać warzywa na połowę omletu. Smażyć 2 minuty na średnim ogniu. Złożyć na pół łopatką. Posypać koperkiem. Podawanie: Przełożyć na talerz. Podawać z pieczonym chlebem bezglutenowym. Można skropić kroplą oleju oliwkowego."
    },
    @{
        id = 13
        title = "Sałatka z mozzarellą di bufala, quinoą i ogórkiem LOW FODMAP"
        description = "Elegancka sałatka z mozzarellą di bufala, quinoą i świeżymi warzywami Low FODMAP. 410 kcal | 17 min. Quinoa (12 min): Quinoę przepłukać pod zimną wodą przez 2 minuty. W małym garnku zagotować 100ml wody z szczyptą soli. Dodać quinoę, gotować 12 minut pod przykryciem na małym ogniu. Po ugotowaniu odstawić na 5 minut bez zdejmowania pokrywy. Rozgarnąć widelcem, skropić łyżeczką oliwy. CAŁKOWICIE ostudzić (ważne - ciepła quinoa roztopi mozzarellę!). Przygotowanie składników (5 min): Ogórek umyć, nie obierać, pokroić w kostki 1cm. Mozzarellę di bufala wyjąć z lodówki 15 min wcześniej. Mozzarellę pokroić w nieregularne kawałki 2-3cm. Roszponkę delikatnie umyć w zimnej wodzie, osuszyć. Bazylię umyć, osuszyć, podarć rękami na większe kawałki. Orzechy włoskie posiekać na większe kawałki. Dressing (2 min): W małej miseczce wymieszać: olej oliwkowy + ocet balsamiczny + sok z cytryny + szczypta soli + pieprz. Energicznie wymieszać widelcem. Składanie sałatki (3 min): Roszponkę rozłożyć na dużym talerzu jako podstawę. Ostudzoną quinoę ułożyć kopką na środku. Kawałki mozzarelli rozłożyć równomiernie wokół quinoa. Kostki ogórka posypać po całej sałatce. Bazylię rozrzucić na wierzchołku. Polać dressing równomiernie. Posypać orzechami na koniec. Finalne podanie (1 min): Doprawić dodatkowo solą i pieprzem jeśli potrzeba. Skropić resztą soku z cytryny. Podawać natychmiast - najlepiej świeże. WAŻNE: Mozzarella di bufala w temperaturze pokojowej - smak się lepiej rozwija. Zachowaj mleko z opakowania - można dodać łyżkę do dressingu. Nie krój za wcześnie - traci soczystość. Quinoa MUSI być całkowicie ostudzona - najważniejsze! Przepłukaj zawsze - usuwa gorzki smak."
    },
    @{
        id = 14
        title = "Stir-fry indyk z warzywami LOW FODMAP"
        description = "Azjatyckie stir-fry z indykiem i warzywami Low FODMAP. 480 kcal | 15 min. Przygotowanie składników (5 min): Indyka pokroić w paski 1cm x 5cm (w poprzek włókien). Cukinię pokroić w paski lub półplastry. Marchew pokroić w cienkie paski. Paprykę pokroić w cienkie paski (MAX 40g - limit Low FODMAP). Imbir obrać i zetrzeć na tarce. Szczypiorek pokroić (tylko zielone części). Marynata dla indyka (2 min): Indyka włożyć do miski. Dodać imbir + pieprz. Wymieszać, zostawić na 5 minut. Stir-fry - smażenie (8 min): Wok lub dużą patelnię rozgrzać na wysokim ogniu. Dodać olej rzepakowy (wędruje po całej patelni). Indyka smażyć 2-3 minuty (nie mieszać za często!). Dodać marchew - smażyć 2 minuty. Dodać paprykę - smażyć 1 minutę. Dodać cukinię - smażyć 1-2 minuty (powinna być al dente). Finalizacja (2 min): Dodać ocet ryżowy. Smażyć 30 sekund (sos powinien syczec). Zdjąć z ognia, dodać olej sezamowy. Wymieszać delikatnie. Posypać nasionami sezamu i szczypiorkiem. WAŻNE Low FODMAP: Papryka czerwona: 40g (limit: 43g) ✅, Cukinia: 120g (low FODMAP bez limitu) ✅, Marchewka: 100g (low FODMAP bez limitu) ✅, Szczypiorek: tylko zielone części (białe = high FODMAP!) ❌. Technika stir-fry: Wysoka temperatura, Wok rozgrzany do smoke point, składniki dodawane szybko. Kolejność: Mięso (najdłużej) → Twarde warzywa → Średnie → Miękkie → Sosy na końcu. Olej sezamowy: Low FODMAP w umiarkowanych ilościach, dodawać na końcu. Wszystkie składniki przygotuj wcześniej, nie przeciążaj patelni. Z ryżem: Podawaj z 50g ryżu brązowego ugotowanego osobno (~650 kcal razem). Zdrowe tłuszcze z oleju sezamowego!"
    },
    @{
        id = 15
        title = "Szprotki z ziemniakami i ogórkiem LOW FODMAP"
        description = "Proste i zdrowe danie z szprotkami, ziemniakami i świeżym ogórkiem Low FODMAP. 395 kcal | 20 min. Ziemniaki (15 min): Ziemniaki umyć, można nie obierać (jeśli młode). Ugotować w osolonej wodzie 12-15 minut do miękkości. Odsączyć, ostudzić 5 minut. Pokroić w plastry 1cm. Przyprawić solą, pieprzem, skropić oliwą. Ogórki (5 min): Ogórki umyć, pokroić w cienkie plastry lub małe kostki. Posypać szczyptą soli, zostawić 5 minut (wypuszczą wodę). Odsączyć z nadmiaru wody. Skropić octem jabłkowym i sokiem z cytryny. Posypać koperkiem. Przygotowanie szprotek (3 min): Szprotki ostrożnie wyjąć z puszki (są delikatne!). Odsączyć z oleju (zachować 1 łyżkę). Rozłożyć na talerzu całe (nie dzielić). Skropić sokiem z cytryny. Przyprawić białym pieprzem. Komponowanie posiłku (2 min): Na talerz ułożyć listki sałaty jako podstawę. Ziemniaki ułożyć z jednej strony. Ogórki z drugiej strony. Szprotki delikatnie ułożyć na środku. Polać całość olejem z puszki + oliwa. Posypać świeżym koperkiem. Bogate w omega-3 ze szprotek!"
    }
)

foreach ($recipe in $finalRecipeUpdates) {
    Update-Recipe -Id $recipe.id -Title $recipe.title -Description $recipe.description
}

Write-Host ""
Write-Host "All recipes have been updated with proper Polish character encoding!" -ForegroundColor Green
