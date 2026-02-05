// BohranHub - Tag Filtering (Content rendered server-side)
(function () {
    'use strict';

    var tags = document.querySelectorAll('.tag[data-tag]');
    var tiles = document.querySelectorAll('.tile[data-tags]');

    if (!tags.length || !tiles.length) return;

    function filter(tag) {
        var i, t, tileTags, hasVisibleChild;
        for (i = 0; i < tiles.length; i++) {
            t = tiles[i];
            tileTags = t.getAttribute('data-tags') || '';

            // Check if this tile matches the filter
            var matches = tag === 'all' || tileTags.indexOf(tag) !== -1;

            // For nested tiles, check if any child is visible
            if (!matches && t.querySelector('.tile-nested')) {
                hasVisibleChild = false;
                var nestedTiles = t.querySelectorAll('.tile-nested[data-tags]');
                for (var j = 0; j < nestedTiles.length; j++) {
                    var nestedTags = nestedTiles[j].getAttribute('data-tags') || '';
                    if (tag === 'all' || nestedTags.indexOf(tag) !== -1) {
                        hasVisibleChild = true;
                        nestedTiles[j].classList.remove('hidden');
                    } else {
                        nestedTiles[j].classList.add('hidden');
                    }
                }
                // Show parent if any child is visible
                if (hasVisibleChild) {
                    t.classList.remove('hidden');
                } else {
                    t.classList.add('hidden');
                }
            } else {
                // Regular tile (no children) or matches itself
                if (matches) {
                    t.classList.remove('hidden');
                    // Show all children if parent matches
                    var childTiles = t.querySelectorAll('.tile-nested');
                    for (var k = 0; k < childTiles.length; k++) {
                        childTiles[k].classList.remove('hidden');
                    }
                } else {
                    t.classList.add('hidden');
                }
            }
        }
    }

    function setActive(btn) {
        for (var i = 0; i < tags.length; i++) {
            tags[i].classList.remove('active');
        }
        btn.classList.add('active');
    }

    function handleClick(e) {
        var btn = e.target;
        if (!btn.classList.contains('tag')) return;
        var tag = btn.getAttribute('data-tag');
        if (tag) {
            setActive(btn);
            filter(tag);
        }
    }

    // Event delegation for better performance
    var tagsList = document.querySelector('.tags-list');
    if (tagsList) {
        tagsList.addEventListener('click', handleClick);
    }
})();
