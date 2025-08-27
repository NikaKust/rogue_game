function Game() {
  const COLS = 40, ROWS = 24;
  const FIELD_W = 1024, FIELD_H = 640;
  const TILE_W = FIELD_W / COLS, TILE_H = FIELD_H / ROWS;

  const ENEMY_HP = 100, ENEMY_DMG = 5;
  const HERO_HP = 100, HERO_DMG = 10;
  const POTION_HEAL = 30, SWORD_BONUS = 10;

  let map = [];
  let hero = { x: 1, y: 1, hp: HERO_HP, attack: HERO_DMG };
  let enemies = [], potions = [], swords = [];

  this.init = function () {
    generateMap();
    hero = { ...randomEmpty(), hp: HERO_HP, attack: HERO_DMG };
    enemies = placeEntities(10, () => ({ hp: ENEMY_HP }));
    potions = placeEntities(10);
    swords = placeEntities(2);
    bindKeys();
    draw();
  };

  // карта
  function generateMap() {
    map = Array.from({ length: ROWS }, () => Array(COLS).fill("W"));

    let rooms = [];
    let roomCount = rand(5, 10);
    for (let i = 0; i < roomCount; i++) {
      let w = rand(3, 8), h = rand(3, 8);
      let x = rand(1, COLS - w - 1), y = rand(1, ROWS - h - 1);
      carveRoom(x, y, w, h);
      rooms.push({ x: x + Math.floor(w/2), y: y + Math.floor(h/2) });
    }

    for (let i = 1; i < rooms.length; i++) {
      connectRooms(rooms[i-1], rooms[i]);
    }
  }

  function carveRoom(x, y, w, h) {
    for (let j = y; j < y+h; j++)
      for (let i = x; i < x+w; i++)
        map[j][i] = "";
  }

  function connectRooms(r1, r2) {
    for (let x = Math.min(r1.x, r2.x); x <= Math.max(r1.x, r2.x); x++)
      map[r1.y][x] = "";
    for (let y = Math.min(r1.y, r2.y); y <= Math.max(r1.y, r2.y); y++)
      map[y][r2.x] = "";
  }

  function placeEntities(count, extra = () => ({})) {
    let list = [];
    for (let i = 0; i < count; i++) {
      list.push({ ...randomEmpty([...list, hero, ...enemies, ...potions, ...swords]), ...extra() });
    }
    return list;
  }
  //отрисовка
  function draw() {
  $(".field").empty();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let tile = $("<div class='tile'></div>").css({
        left: x * TILE_W,
        top: y * TILE_H,
        width: TILE_W,
        height: TILE_H
      });
      if (map[y][x] === "W") tile.addClass("tileW"); 
      $(".field").append(tile);
    }
  }

  swords.forEach(s => createTile("tileSW", s));
  potions.forEach(p => createTile("tileHP", p));

  enemies.forEach(e => createTile("tileE", e, e.hp));

  createTile("tileP", hero, hero.hp);
  }

  function createTile(className, obj, hp = null) {
    let t = $("<div class='tile'></div>")
      .addClass(className)
      .css({ left: obj.x*TILE_W, top: obj.y*TILE_H, width: TILE_W, height: TILE_H });
    if (hp !== null) {
      t.append($("<div class='health'></div>").css("width", hp+"%"));
    }
    $(".field").append(t);
  }

  // wasd негодяйское
  function bindKeys() {
    $(document).keydown(e => {
      let { code } = e;
      if (["KeyW","KeyS","KeyA","KeyD"].includes(code)) {
        moveHero(code);
        enemyTurn();
      } else if (code === "Space") {
        heroAttack();
        enemyTurn();
      }
      draw();
    });
  }

  function moveHero(code) {
    let dx = 0, dy = 0;
    if (code==="KeyW") dy=-1; else if (code==="KeyS") dy=1;
    else if (code==="KeyA") dx=-1; else if (code==="KeyD") dx=1;
    let nx = hero.x+dx, ny = hero.y+dy;
    if (canMove(nx,ny)) {
      hero.x = nx; hero.y = ny;
      checkItems();
    }
  }

  // атаки
  function heroAttack() {
    enemies = enemies.filter(e => {
      if (adjacent(e, hero)) {
        e.hp -= hero.attack;
        return e.hp > 0;
      }
      return true;
    });
  }

  function enemyTurn() {
    enemies.forEach(e => {
      if (adjacent(e, hero)) {
        hero.hp = Math.max(0, hero.hp - ENEMY_DMG);
        return;
      }
      let dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      let d = dirs[rand(0,3)];
      let nx = e.x+d.x, ny = e.y+d.y;
      if (canMove(nx,ny) && !enemies.some(en=>en!==e && en.x===nx && en.y===ny)) {
        e.x = nx; e.y = ny;
      }
    });
  }

  function checkItems() {
    potions = potions.filter(p => {
      if (p.x===hero.x && p.y===hero.y) { hero.hp = Math.min(HERO_HP, hero.hp+POTION_HEAL); return false; }
      return true;
    });
    swords = swords.filter(s => {
      if (s.x===hero.x && s.y===hero.y) { hero.attack += SWORD_BONUS; return false; }
      return true;
    });
  }

  function canMove(x,y) {
    return !(x<0 || y<0 || x>=COLS || y>=ROWS) && map[y][x] !== "W";
  }
  function randomEmpty(exclude=[]) {
    let pos;
    do {
      pos = { x: rand(1,COLS-2), y: rand(1,ROWS-2) };
    } while (map[pos.y][pos.x]==="W" || exclude.some(e => e.x===pos.x && e.y===pos.y));
    return pos;
  }
  function adjacent(a,b) { return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1; }
  function rand(min,max) { return Math.floor(Math.random()*(max-min+1))+min; }
}
