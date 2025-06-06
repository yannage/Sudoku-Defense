const CharactersModule = (function() {
    let characters = {};

    function load() {
        if (Object.keys(characters).length) return Promise.resolve(characters);
        return fetch('data/characters.json')
            .then(res => res.json())
            .then(data => {
                characters = data;
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
