const CharactersModule = (function() {
    let characters = {};

    // Simple ability implementations so abilities are usable
    const abilityFunctions = {
        redirect_path: function() {
            if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
                BoardManager.generateEnemyPath();
                EventSystem.publish(GameEvents.STATUS_MESSAGE, 'Enemy path redirected!');
            }
            return true;
        },
        power_surge: function() {
            if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
                const towers = TowersModule.getTowers();
                towers.forEach(t => {
                    if (!t._baseDamage) t._baseDamage = t.damage;
                    t.damage = t._baseDamage * 2;
                    setTimeout(() => { t.damage = t._baseDamage; }, 5000);
                });
                EventSystem.publish(GameEvents.STATUS_MESSAGE, 'Towers empowered!');
            }
            return true;
        },
        precision_strike: function() {
            if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
                EnemiesModule.getEnemies().forEach(e => {
                    e.health = Math.max(0, e.health - e.maxHealth * 0.3);
                });
                EventSystem.publish(GameEvents.STATUS_MESSAGE, 'Precision strike hits all enemies!');
            }
            return true;
        },
        time_warp: function() {
            if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
                EnemiesModule.getEnemies().forEach(e => {
                    e.originalSpeed = e.originalSpeed || e.speed;
                    e.speed *= 0.5;
                    e.slowed = true;
                    setTimeout(() => {
                        e.speed = e.originalSpeed;
                        e.slowed = false;
                    }, 8000);
                });
                EventSystem.publish(GameEvents.STATUS_MESSAGE, 'Enemies slowed!');
            }
            return true;
        },
        transmutation: function() {
            if (window.TowersModule && window.BoardManager &&
                typeof TowersModule.getTowers === 'function' &&
                typeof BoardManager.getSolution === 'function' &&
                typeof TowersModule.getTowerTypeData === 'function') {
                const towers = TowersModule.getTowers();
                const solution = BoardManager.getSolution();
                let changed = false;
                towers.forEach(t => {
                    const correct = solution?.[t.row]?.[t.col];
                    if (correct && t.type !== correct) {
                        const data = TowersModule.getTowerTypeData(correct);
                        t.type = correct;
                        if (data && data.damage) {
                            t.damage = data.damage;
                        }
                        t.matchesSolution = true;
                        changed = true;
                    }
                });
                EventSystem.publish(GameEvents.STATUS_MESSAGE, changed ?
                    'Incorrect towers corrected!' : 'No incorrect towers found.');
            }
            return true;
        }
    };

    function load() {
        if (Object.keys(characters).length) return Promise.resolve(characters);
        return fetch('data/characters.json')
            .then(res => res.json())
            .then(data => {
                characters = data;

                // Attach ability execute functions
                Object.values(characters).forEach(char => {
                    const ability = char.uniqueAbility;
                    if (ability && !ability.execute) {
                        ability.execute = abilityFunctions[ability.id] || function() {
                            EventSystem.publish(GameEvents.STATUS_MESSAGE, ability.name + ' activated!');
                            return true;
                        };
                    }
                });

                window.characters = characters;
                return characters;
            });
    }

    function get(id) {
        return characters[id];
    }

    return { load, get };
})();

// Automatically start loading definitions
CharactersModule.load();
