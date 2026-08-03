/* Banco de alimentos (offline, sem IA) e mapa de ícones por categoria. */
export function buildFoodDB(){
  const db = []; let id = 1;
  function push(name, category, kcal, protein, carbs, fat){
    db.push({id:id++, name, category, kcal:Math.round(kcal), protein:Math.round(protein*10)/10, carbs:Math.round(carbs*10)/10, fat:Math.round(fat*10)/10, unit:false, unitWeight:null});
  }

  /* ---- Carnes bovinas (valor base = grelhado; ajustado por metodo de preparo) ---- */
  const BEEF_BASE = {
    'Patinho':[196,32,0,7.0], 'Alcatra':[218,31,0,9.5], 'Contrafil\u00e9':[233,30,0,12.0], 'Picanha':[289,27,0,20.0],
    'Maminha':[206,31,0,8.5], 'Cox\u00e3o mole':[194,32,0,6.8], 'Cox\u00e3o duro':[201,31,0,7.8], 'Fraldinha':[252,28,0,15.5],
    'Ac\u00e9m':[231,29,0,13.0], 'M\u00fasculo':[201,32,0,7.0], 'Costela':[330,26,0,25.0], 'Cupim':[348,25,0,27.5],
    'Lagarto':[183,33,0,5.0], 'Fil\u00e9 mignon':[215,32,0,9.0], 'Patinho mo\u00eddo':[196,32,0,7.0]
  };
  const PREP_MEAT = {
    'grelhado':[1.0,1.0,0,1.0], 'cozido':[0.93,0.97,0,0.85], 'assado':[1.05,1.0,0,1.05],
    'na chapa':[1.0,1.0,0,1.0], 'cru':[0.78,0.85,0,0.95], 'ensopado':[1.0,0.95,2.5,1.15], 'refogado':[1.02,0.98,1.5,1.1]
  };
  Object.keys(BEEF_BASE).forEach(cut=>{
    const b = BEEF_BASE[cut];
    Object.keys(PREP_MEAT).forEach(prep=>{
      const m = PREP_MEAT[prep];
      push('Carne bovina - '+cut+' ('+prep+')', 'Carnes', b[0]*m[0], b[1]*m[1], b[2]+m[2], b[3]*m[3]);
    });
  });

  /* ---- Carne su\u00edna (mesmo sistema de preparo da carne bovina) ---- */
  const PORK_BASE = {
    'Lombo':[210,27,0,11.0], 'Pernil':[221,26,0,13.0], 'Costela su\u00edna':[280,22,0,21.0], 'Bisteca':[231,24,0,15.0],
    'Paleta':[224,25,0,13.0], 'Fil\u00e9 su\u00edno':[196,28,0,9.0], 'Carne mo\u00edda su\u00edna':[230,24,0,15.0], 'Panceta':[397,17,0,37.0]
  };
  Object.keys(PORK_BASE).forEach(cut=>{
    const b = PORK_BASE[cut];
    Object.keys(PREP_MEAT).forEach(prep=>{
      const m = PREP_MEAT[prep];
      push('Carne su\u00edna - '+cut+' ('+prep+')', 'Carnes', b[0]*m[0], b[1]*m[1], b[2]+m[2], b[3]*m[3]);
    });
  });

  /* ---- Frango ---- */
  const CHICKEN_BASE = {
    'Peito':[165,31,0,3.6], 'Coxa':[209,26,0,10.9], 'Sobrecoxa':[216,25,0,12.0], 'Asa':[203,27,0,10.0],
    'Fil\u00e9':[165,31,0,3.6], 'Moela':[172,27,0,6.0], 'Cora\u00e7\u00e3o':[200,26,0,10.0], 'Frango mo\u00eddo':[143,20,0,6.5]
  };
  const PREP_CHICKEN = {
    'grelhado':[1.0,1.0,0,1.0], 'cozido':[0.95,0.97,0,0.85], 'assado':[1.05,1.0,0,1.1],
    'frito':[1.35,0.95,3,2.2], 'desfiado':[0.95,1.0,0,0.85], 'ensopado':[1.0,0.95,2,1.2]
  };
  Object.keys(CHICKEN_BASE).forEach(cut=>{
    const b = CHICKEN_BASE[cut];
    Object.keys(PREP_CHICKEN).forEach(prep=>{
      const m = PREP_CHICKEN[prep];
      push('Frango - '+cut+' ('+prep+')', 'Aves', b[0]*m[0], b[1]*m[1], b[2]+m[2], b[3]*m[3]);
    });
  });

  /* ---- Peixes e frutos do mar ---- */
  const FISH_BASE = {
    'Til\u00e1pia':[128,26,0,2.7], 'Salm\u00e3o':[208,20,0,13.4], 'Atum':[144,23,0,5.0], 'Sardinha':[210,24,0,11.5],
    'Bacalhau':[120,24,0,2.0], 'Merluza':[90,18,0,1.3], 'Pintado':[105,19,0,3.0], 'Tambaqui':[200,18,0,14.0],
    'Camar\u00e3o':[99,21,0.2,1.4], 'Polvo':[110,20,4,1.4], 'Lula':[95,18,2,1.4]
  };
  const PREP_FISH = {
    'grelhado':[1.0,1.0,0,1.0], 'assado':[1.05,1.0,0,1.05], 'cozido':[0.92,0.97,0,0.85],
    'frito':[1.4,0.95,4,2.3], 'cru':[0.85,0.9,0,0.95]
  };
  Object.keys(FISH_BASE).forEach(cut=>{
    const b = FISH_BASE[cut];
    Object.keys(PREP_FISH).forEach(prep=>{
      const m = PREP_FISH[prep];
      push(cut+' ('+prep+')', 'Peixes e frutos do mar', b[0]*m[0], b[1]*m[1], b[2]+m[2], b[3]*m[3]);
    });
  });

  /* ---- Ovos e latic\u00ednios ---- */
  [
    ['Ovo cozido',155,13,1.1,11],['Ovo frito',196,14,0.9,15],['Ovo mexido',168,12,2,12],['Clara de ovo',52,11,0.7,0.2],
    ['Leite integral',60,3.2,4.7,3.3],['Leite desnatado',35,3.4,5,0.2],['Leite semidesnatado',46,3.3,4.9,1.6],
    ['Iogurte natural',61,3.5,4.7,3.3],['Iogurte grego',97,9,4,5],['Iogurte de frutas',85,3.5,13,2],
    ['Queijo minas',264,17,3,20],['Queijo mu\u00e7arela',280,22,2,21],['Queijo prato',360,24,1.5,29],['Queijo cottage',98,11,3.4,4.3],
    ['Requeij\u00e3o Catupiry',257,9,3,24],['Requeij\u00e3o Catupiry Light',180,10,4,14],
    ['Requeij\u00e3o Vigor',250,9,3,23],['Requeij\u00e3o Vigor Light',175,10,4,13],
    ['Requeij\u00e3o Dan\u00fabio',255,9,3,23],['Requeij\u00e3o Dan\u00fabio Light',178,10,4,13.5],
    ['Requeij\u00e3o Tirolez',250,9,3,23],['Requeij\u00e3o Tirolez Light',175,10,4,13],
    ['Requeij\u00e3o Itamb\u00e9',252,9,3,23],['Requeij\u00e3o Itamb\u00e9 Light',177,10,4,13.5],
    ['Requeij\u00e3o Po\u00e7os de Caldas',255,9,3,23],['Requeij\u00e3o Po\u00e7os de Caldas Light',178,10,4,13.5],
    ['Manteiga',717,0.9,0.1,81],['Cream cheese',342,6,4,34],
    ['Queijo parmes\u00e3o',392,35,3.2,26],['Queijo provolone',351,26,2.1,27],['Queijo brie',334,20,0.5,28],
    ['Queijo gorgonzola',353,21,2.3,29],['Queijo coalho',330,25,1,25],['Ricota',140,11,3,8],
    ['Petit suisse',110,5,15,3.5],['Danone',75,3.2,12,1.5],['Bebida l\u00e1ctea',55,1.5,10,1],
    ['Leite condensado',321,7.9,55,8.7],['Creme de leite',292,2.4,3.5,29],['Chantilly',350,2,10,35],['Leite em p\u00f3',496,26,38,26]
  ].forEach(r=>push(r[0],'Ovos e latic\u00ednios',r[1],r[2],r[3],r[4]));

  /* ---- Frutas ---- */
  const FRUIT_BASE = {
    'Banana':[89,1.1,23,0.3],'Ma\u00e7\u00e3':[52,0.3,14,0.2],'Laranja':[47,0.9,12,0.1],'Morango':[32,0.7,7.7,0.3],
    'Abacaxi':[50,0.5,13,0.1],'Uva':[69,0.7,18,0.2],'Manga':[60,0.8,15,0.4],'Mam\u00e3o':[43,0.5,11,0.1],
    'Melancia':[30,0.6,8,0.2],'Mel\u00e3o':[34,0.8,8,0.2],'Pera':[57,0.4,15,0.1],'Kiwi':[61,1.1,15,0.5],
    'Abacate':[160,2,8.5,15],'P\u00eassego':[39,0.9,10,0.3],'Ameixa':[46,0.7,11,0.3],'Caqui':[70,0.6,18,0.2],
    'Goiaba':[68,2.6,14,1.0],'Maracuj\u00e1':[97,2.0,23,0.7],'Lim\u00e3o':[29,1.1,9,0.3],'Tangerina':[53,0.8,13,0.3],
    'Coco':[354,3.3,15,33],'Figo':[74,0.8,19,0.3],'Framboesa':[52,1.2,12,0.7],'Mirtilo':[57,0.7,14,0.3],
    'Amora':[43,1.4,9.6,0.5],'Carambola':[31,1.0,7,0.3],'Jaca':[95,1.7,23,0.6],'Graviola':[66,1.0,17,0.3],
    'Acerola':[33,0.9,8,0.3],'Cereja':[63,1.1,16,0.2],'Pitaya':[60,1.2,13,0.4],'Lichia':[66,0.8,17,0.4],
    'Physalis':[53,1.9,11,0.7],'Umbu':[37,0.8,9,0.2],'Cupua\u00e7u':[49,1.4,10,1.0],'Buriti':[200,2.0,26,15]
  };
  Object.keys(FRUIT_BASE).forEach(fr=>{
    const b = FRUIT_BASE[fr];
    push(fr+' (in natura)', 'Frutas', b[0], b[1], b[2], b[3]);
    push(fr+' (seca(o))', 'Frutas', b[0]*4.0, b[1]*3.5, b[2]*4.0, b[3]*2.0);
  });

  /* ---- Vegetais e legumes ---- */
  const VEG_BASE = {
    'Alface':[15,1.4,2.9,0.2],'Tomate':[18,0.9,3.9,0.2],'Cenoura':[41,0.9,10,0.2],'Br\u00f3colis':[34,2.8,7,0.4],
    'Couve-flor':[25,1.9,5,0.3],'Abobrinha':[17,1.2,3.1,0.3],'Berinjela':[25,1.0,6,0.2],'Pepino':[15,0.7,3.6,0.1],
    'Piment\u00e3o':[31,1.0,6,0.3],'Repolho':[25,1.3,6,0.1],'Espinafre':[23,2.9,3.6,0.4],'Couve':[49,4.3,9,0.9],
    'Chuchu':[19,0.8,4.5,0.1],'Beterraba':[43,1.6,10,0.2],'Vagem':[31,1.8,7,0.1],'Quiabo':[33,2.0,7,0.2],
    'R\u00facula':[25,2.6,3.7,0.7],'Agri\u00e3o':[11,2.3,1.3,0.1],'Cebola':[40,1.1,9.3,0.1],'Alho':[149,6.4,33,0.5],
    'Batata':[77,2.0,17,0.1],'Batata doce':[86,1.6,20,0.1],'Mandioca':[160,1.4,38,0.3],'Inhame':[118,1.5,27,0.2],
    'Milho verde':[86,3.3,19,1.2],'Ervilha':[81,5.4,14,0.4],'Cogumelo':[22,3.1,3.3,0.3]
  };
  Object.keys(VEG_BASE).forEach(v=>{
    const b = VEG_BASE[v];
    push(v+' (cru)', 'Vegetais e legumes', b[0], b[1], b[2], b[3]);
    push(v+' (cozido)', 'Vegetais e legumes', b[0]*1.0, b[1]*0.95, b[2]*1.0, b[3]*1.0);
  });

  /* ---- Gr\u00e3os e cereais ---- */
  [
    ['Arroz branco cozido',128,2.5,28,0.2],['Arroz integral cozido',124,2.6,26,1.0],
    ['Feij\u00e3o carioca cozido',76,4.8,14,0.5],['Feij\u00e3o preto cozido',77,4.5,14,0.5],
    ['Lentilha cozida',116,9.0,20,0.4],['Gr\u00e3o de bico cozido',164,8.9,27,2.6],['Quinoa cozida',120,4.4,21,1.9],
    ['Aveia em flocos',389,17,66,7],['Granola',471,10,64,20],['Milho para canjica',100,3,20,1.5],
    ['Cuscuz',112,2.2,23,0.2],['Macarr\u00e3o cozido',131,5,25,1.1],['Macarr\u00e3o integral cozido',124,5.3,25,1.0],
    ['Farinha de mandioca',365,1.6,88,0.3],['Farofa pronta',405,3,60,15],['Soja cozida',173,16.6,9.9,9],
    ['Feij\u00e3o branco cozido',139,9.7,25,0.5],['Feij\u00e3o fradinho cozido',116,8,21,0.5],['Lentilha vermelha cozida',110,8,19,0.4]
  ].forEach(r=>push(r[0],'Gr\u00e3os e cereais',r[1],r[2],r[3],r[4]));

  /* ---- P\u00e3es e torradas ---- */
  [
    ['P\u00e3o franc\u00eas',300,8,58,3],['P\u00e3o de forma tradicional',253,8,49,3],['P\u00e3o integral',247,10,42,4],
    ['P\u00e3o de forma integral',250,9,45,3.5],['P\u00e3o s\u00edrio',275,9,55,1.5],['P\u00e3o australiano',280,9,52,4],
    ['Torrada tradicional',407,10,77,5],['Torrada integral',390,12,70,6],
    ['Magic Toast Tradicional',415,10,75,8],['Magic Toast Multigr\u00e3os',410,11,70,9],['Magic Toast Integral',400,11,68,8],
    ['Magic Toast Alho',420,9,73,10],['Magic Toast Cebola',418,9,73,10],['Magic Toast Requeij\u00e3o',430,9,72,12],
    ['Magic Toast Light',380,11,68,6],['Magic Toast Proven\u00e7al',415,10,73,9],['Magic Toast Queijo',425,11,70,11],
    ['Magic Toast Pizza',418,10,72,10],['Magic Toast Or\u00e9gano',412,10,73,8],['Magic Toast Doce de Leite',440,8,78,9],
    ['Magic Toast Canela',435,8,77,8],['Bisnaguinha',300,8,55,5],['P\u00e3o de queijo',350,7,32,20],
    ['Rap10 Tradicional',300,8,50,7],['Rap10 Integral',290,9,47,7],['Rap10 Multigr\u00e3os',295,9,48,7.5],
    ['Rap10 Light',270,9,44,5],['Rap10 Sem Gl\u00faten',285,7,52,6],['Rap10 Sem Lactose',298,8,50,7],
    ['Tapioca',190,0.5,46,0.2],['Panqueca simples',220,7,28,8]
  ].forEach(r=>push(r[0],'P\u00e3es e torradas',r[1],r[2],r[3],r[4]));

  /* ---- Bolachas e biscoitos ---- */
  [
    ['Bolacha \u00e1gua e sal',440,9,73,12],['Bolacha maisena',440,7,75,12],['Bolacha recheada de chocolate',480,6,68,20],
    ['Cream cracker',440,9,70,13],['Biscoito de polvilho',490,4,60,25],['Biscoito rosquinha',420,7,72,11],
    ['Wafer recheado',500,5,60,26],['Bolacha integral',430,8,68,13],['Biscoito amanteigado',470,6,65,20],
    ['Biscoito de aveia',450,8,63,17]
  ].forEach(r=>push(r[0],'Bolachas e biscoitos',r[1],r[2],r[3],r[4]));

  /* ---- Doces e sobremesas ---- */
  [
    ['Chocolate ao leite',545,7.6,59,30],['Chocolate amargo 70%',546,7.8,46,38],['Brigadeiro',390,4,55,17],
    ['Pudim de leite',150,4,26,3.5],['Sorvete de creme',207,3.7,24,11],['Sorvete de morango',180,2.5,28,7],
    ['Bolo de chocolate',370,5,52,16],['Bolo de cenoura',330,4,45,15],['Mousse de maracuj\u00e1',180,3,22,9],
    ['Gelatina',62,1.5,15,0],['Doce de leite',315,7,55,7],['Pa\u00e7oca',460,15,45,25],['P\u00e9 de moleque',450,10,55,20],
    ['Torta de lim\u00e3o',300,4,38,15],['Cheesecake',321,5,26,22],['Brownie',405,5,52,20],['Cookie',480,5,65,22],
    ['Churros',380,5,45,20],['Waffle',290,6,40,12],['Picol\u00e9 de frutas',90,0.5,22,0.2],['Chocolate branco',539,5.9,59,32],
    ['Bombom',500,5,58,28],['Trufa',480,4,50,30]
  ].forEach(r=>push(r[0],'Doces e sobremesas',r[1],r[2],r[3],r[4]));

  /* ---- Bebidas ---- */
  [
    ['Suco de laranja natural',45,0.7,10.4,0.2],['Suco de uva integral',60,0.4,15,0.1],['Refrigerante comum',42,0,10.6,0],
    ['Refrigerante zero',0.3,0,0.1,0],['\u00c1gua de coco',19,0.7,3.7,0.2],['Caf\u00e9 sem a\u00e7\u00facar',2,0.1,0,0],
    ['Ch\u00e1 sem a\u00e7\u00facar',1,0,0.2,0],['Achocolatado pronto',65,1.6,11,1.5],['Vitamina de banana',85,3,14,2],
    ['Isot\u00f4nico',24,0,6,0],['Energ\u00e9tico',45,0,11,0],['Cerveja',43,0.5,3.6,0],['Vinho tinto',85,0.1,2.6,0],
    ['Leite de am\u00eandoas',17,0.6,0.9,1.2],['Leite de aveia',46,1,7,1.5],['Leite de coco',152,1.4,3.3,15],
    ['Kombucha',30,0,7,0],['Ch\u00e1 gelado',34,0,8,0],['Suco de caixinha',46,0.2,11,0],['\u00c1gua t\u00f4nica',34,0,9,0],

    /* -- Refrigerantes zero / diet / light, por marca -- */
    ['Coca-Cola Zero',0.2,0,0,0],['Coca-Cola Diet',0.3,0,0.1,0],
    ['Pepsi Zero',0.2,0,0,0],['Pepsi Black',0.2,0,0,0],
    ['Guaran\u00e1 Antarctica Zero',0.3,0,0.1,0],['Guaran\u00e1 Jesus Zero',0.3,0,0.1,0],
    ['Fanta Laranja Zero',0.4,0,0.2,0],['Fanta Uva Zero',0.4,0,0.2,0],
    ['Sprite Zero',0.2,0,0,0],['Schweppes Citrus Zero',0.3,0,0.1,0],
    ['Sukita Zero',0.4,0,0.2,0],['H2OH! Zero',20,0,5,0],
    ['Dolly Zero (Guaran\u00e1)',0.3,0,0.1,0],['Dolly Zero (Cola)',0.3,0,0.1,0],
    ['Itub\u00e3ina Zero',0.4,0,0.2,0],['Soda Limonada Zero',0.4,0,0.2,0],

    /* -- Refrigerantes tradicionais (com a\u00e7\u00facar), por marca -- */
    ['Coca-Cola Original',42,0,10.6,0],['Pepsi Original',41,0,11,0],
    ['Guaran\u00e1 Antarctica Original',44,0,11,0],['Fanta Laranja Original',48,0,12,0],
    ['Fanta Uva Original',49,0,12.4,0],['Sprite Original',39,0,10,0],
    ['Sukita Laranja',47,0,12,0],['Dolly Cola',42,0,10.7,0],

    /* -- Ch\u00e1s (quentes e prontos, sem a\u00e7\u00facar / adoçados) -- */
    ['Ch\u00e1 verde sem a\u00e7\u00facar',1,0,0.3,0],['Ch\u00e1 preto sem a\u00e7\u00facar',1,0,0.2,0],
    ['Ch\u00e1 de camomila',1,0,0.2,0],['Ch\u00e1 de hibisco',2,0,0.5,0],
    ['Ch\u00e1 de erva-doce',1,0,0.2,0],['Ch\u00e1 de cidreira',1,0,0.2,0],
    ['Ch\u00e1 de gengibre',3,0,0.7,0],['Ch\u00e1 mate sem a\u00e7\u00facar',2,0,0.4,0],
    ['Ch\u00e1 branco sem a\u00e7\u00facar',1,0,0.2,0],['Ch\u00e1 de hortel\u00e3',1,0,0.2,0],
    ['Matte Leão sabor limão',34,0,8.4,0],['Matte Leão zero a\u00e7\u00facar',1,0,0.3,0],
    ['Ch\u00e1 gelado de p\u00eassego (Lipton)',36,0,9,0],['Lipton Ice Tea Zero',1,0,0.3,0],
    ['Ch\u00e1 mate gelado (Leão)',37,0,9.3,0],

    /* -- Sucos (naturais, prontos e concentrados) -- */
    ['Suco de maracuj\u00e1 natural',38,0.5,9.4,0.1],['Suco de abacaxi natural',48,0.3,12,0.1],
    ['Suco de melancia natural',30,0.6,7.6,0.1],['Suco de manga natural',54,0.4,13.7,0.2],
    ['Suco de caju natural',43,0.3,11,0.1],['Suco de acerola natural',28,0.4,6.5,0.2],
    ['Suco de goiaba natural',52,0.7,13,0.2],['Suco de morango natural',33,0.5,8,0.2],
    ['Suco de lim\u00e3o natural (limonada)',35,0.2,9,0],['Suco verde detox',45,1.2,10,0.2],
    ['Suco Del Valle (caixinha)',48,0.2,12,0],['Suco Del Valle Mais Suco',44,0.3,11,0],
    ['Suco Ades (soja)',43,1.0,8,1.0],['Suco Da Fruta (Maguary)',46,0.2,11.5,0],
    ['N\u00e9ctar de p\u00eassego',52,0.2,13,0],['N\u00e9ctar de manga',54,0.2,13.5,0],
    ['Suco integral de uva (Su\u00e9lo/Aurora)',60,0.4,15,0.1],['Suco em p\u00f3 (preparado)',33,0,8.2,0]
  ].forEach(r=>push(r[0],'Bebidas',r[1],r[2],r[3],r[4]));

  /* ---- Oleaginosas ---- */
  [
    ['Castanha do par\u00e1',656,14,12,66],['Castanha de caju',553,18,30,44],['Amendoim',567,25,16,49],
    ['Am\u00eandoa',579,21,22,50],['Nozes',654,15,14,65],['Avel\u00e3',628,15,17,61],['Pistache',560,20,28,45],
    ['Macad\u00e2mia',718,8,14,76],['Semente de girassol',584,21,20,51],['Semente de ab\u00f3bora',559,30,11,49],
    ['Chia',486,17,42,31],['Linha\u00e7a',534,18,29,42],['Gergelim',573,18,23,50]
  ].forEach(r=>push(r[0],'Oleaginosas',r[1],r[2],r[3],r[4]));

  /* ---- Pratos prontos ---- */
  [
    ['Lasanha \u00e0 bolonhesa',160,8,14,8],['Macarr\u00e3o \u00e0 bolonhesa',145,6,20,4.5],['Feijoada completa',180,10,15,9],
    ['Strogonoff de frango',170,10,10,10],['Risoto de camar\u00e3o',150,7,20,4],['Pizza de mu\u00e7arela',266,11,33,10],
    ['Hamb\u00farguer artesanal',280,15,20,16],['Batata frita',312,3.4,41,15],['Nuggets de frango',296,15,18,19],
    ['Sushi (combinado)',150,6,25,2],['Yakisoba',120,5,18,3],['Tapioca recheada',220,6,35,6]
  ].forEach(r=>push(r[0],'Pratos prontos',r[1],r[2],r[3],r[4]));

  /* ---- Suplementos ---- */
  [
    ['Whey protein concentrado',390,78,8,5],['Whey protein isolado',370,85,3,1.5],['Albumina',370,80,3,1],
    ['Case\u00edna',360,75,5,2],['Hipercal\u00f3rico',390,15,70,6],['Creatina',0,0,0,0],['BCAA em p\u00f3',350,80,3,0],
    ['Barra de prote\u00edna',350,25,35,10],['Barra de cereal',390,7,68,9]
  ].forEach(r=>push(r[0],'Suplementos',r[1],r[2],r[3],r[4]));

  /* ---- Temperos e molhos ---- */
  [
    ['Azeite de oliva extra virgem',884,0,0,100],['\u00d3leo de soja',884,0,0,100],['Molho de tomate',35,1.5,7,0.5],
    ['Maionese',680,1,3,75],['Ketchup',100,1.2,26,0.1],['Mostarda',66,4,5,3.7],['Molho shoyu',60,6,6,0],
    ['Vinagre',18,0,0.4,0],['Sal',0,0,0,0],['A\u00e7\u00facar refinado',387,0,100,0],['Mel de abelha',304,0.3,82,0],
    ['Geleia de frutas',250,0.3,65,0],['Manteiga de amendoim',588,25,20,50],['Pasta de amendoim integral',600,25,18,52],
    ['Geleia diet',120,0.3,30,0],['A\u00e7\u00facar mascavo',380,0,98,0],['Ado\u00e7ante',20,0,5,0],
    ['Granulado de chocolate',450,4,70,18],['Cobertura de chocolate',480,3,65,22],['Raspas de coco',660,7,24,65]
  ].forEach(r=>push(r[0],'Temperos e molhos',r[1],r[2],r[3],r[4]));

  /* ---- Sopas ---- */
  [
    ['Sopa de legumes',45,2,7,1],['Canja de galinha',55,4,6,1.5],['Caldo verde',75,2,9,3],
    ['Sopa de ervilha',70,4,10,1.5],['Creme de ab\u00f3bora',60,1.5,9,2]
  ].forEach(r=>push(r[0],'Sopas',r[1],r[2],r[3],r[4]));

  /* ---- Farinhas ---- */
  [
    ['Farinha de trigo',364,10,76,1],['Farinha de aveia',389,17,66,7],['Farinha de am\u00eandoas',571,21,20,50],
    ['Farinha de coco',443,20,60,15],['F\u00e9cula de batata',357,0.1,86,0.1],['Amido de milho',381,0.3,91,0.1]
  ].forEach(r=>push(r[0],'Farinhas',r[1],r[2],r[3],r[4]));

  /* ---- Industrializados ---- */
  [
    ['Salsicha',250,12,3,20],['Presunto',145,18,2,7],['Peito de peru fatiado',110,20,2,2.5],['Mortadela',280,13,3,25],
    ['Salame',400,22,2,34],['Lingui\u00e7a',300,13,3,26],['Bacon',541,37,1,42],['Carne seca',250,45,0,7],
    ['Charque',270,40,0,10],['Atum enlatado',128,26,0,2],['Sardinha enlatada',210,20,0,14],['Azeitona verde',145,1,4,15],
    ['Azeitona preta',350,2.5,6,35],['Palmito',26,2,4,0.5],['Milho enlatado',86,3.3,19,1.2],['Ervilha enlatada',68,5,12,0.4],
    ['Extrato de tomate',82,4,18,0.5],['Polpa de tomate',32,1.6,7,0.3],['Sopa instant\u00e2nea',380,8,60,12],
    ['Macarr\u00e3o instant\u00e2neo',440,9,60,17],['Caldo de galinha em cubo',250,10,20,15],['Temperos prontos',200,5,20,10],
    ['Cereal matinal chocolate',380,6,82,4],['Cereal matinal integral',370,8,80,3],['Barra de cereal frutas',380,6,75,6],
    ['Salgadinho de milho',500,6,60,26],['Pipoca doce',480,6,68,20],['Pipoca salgada',420,10,60,17],
    ['Coxinha',280,10,25,15],['Pastel',300,7,30,17],['Esfiha',270,9,28,13],['Kibe',230,12,15,14],
    ['Empada',300,7,25,18],['Torta salgada',280,8,25,15],['Batata palha',536,6,53,35],['Cachorro quente',250,10,20,15],
    ['Mucilon',390,8,80,3],['Farinha l\u00e1ctea',395,9,80,3]
  ].forEach(r=>push(r[0],'Industrializados',r[1],r[2],r[3],r[4]));

  // ---- mark items that make more sense measured "por unidade" ----
  const UNIT_WEIGHTS = {
    'Ovo cozido':50, 'Ovo frito':50, 'Ovo mexido':50,
    'Banana (in natura)':120, 'Ma\u00e7\u00e3 (in natura)':150, 'Laranja (in natura)':130, 'Pera (in natura)':140,
    'Kiwi (in natura)':75, 'P\u00eassego (in natura)':150, 'Ameixa (in natura)':60, 'Caqui (in natura)':130,
    'Tangerina (in natura)':80, 'Lim\u00e3o (in natura)':60, 'Coco (in natura)':400, 'Abacate (in natura)':200,
    'Figo (in natura)':50, 'Manga (in natura)':200, 'Mam\u00e3o (in natura)':400,
    'P\u00e3o franc\u00eas':50, 'P\u00e3o de forma tradicional':25, 'P\u00e3o integral':25, 'P\u00e3o de forma integral':25,
    'P\u00e3o s\u00edrio':60, 'P\u00e3o australiano':70, 'Bisnaguinha':25, 'P\u00e3o de queijo':30,
    'Rap10 Tradicional':50, 'Rap10 Integral':50, 'Rap10 Multigr\u00e3os':50,
    'Rap10 Light':50, 'Rap10 Sem Gl\u00faten':50, 'Rap10 Sem Lactose':50
  };
  db.forEach(f=>{ if(UNIT_WEIGHTS[f.name]){ f.unit = true; f.unitWeight = UNIT_WEIGHTS[f.name]; } });

  return db;
}
export const FOOD_DB = buildFoodDB();

export const CATEGORY_ICONS = {
  'Carnes':'beef', 'Aves':'drumstick', 'Peixes e frutos do mar':'fish', 'Ovos e laticínios':'egg',
  'Frutas':'apple', 'Vegetais e legumes':'carrot', 'Grãos e cereais':'wheat', 'Pães e torradas':'croissant',
  'Bolachas e biscoitos':'cookie', 'Doces e sobremesas':'cake-slice', 'Bebidas':'cup-soda', 'Oleaginosas':'nut',
  'Pratos prontos':'utensils-crossed', 'Suplementos':'pill', 'Temperos e molhos':'droplet', 'Sopas':'soup',
  'Farinhas':'package', 'Industrializados':'package'
};
