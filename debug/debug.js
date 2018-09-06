
document.addEventListener('DOMContentLoaded', function() {
    let node;

    for (node of document.querySelectorAll('p')) {
        if (/^\s*$/.test(node.textContent)) {
            node.classList.add('debug-border');
            node.setAttribute('title', 'Are you sure this paragraph should be empty?');
        }
    }

    for (node of document.querySelectorAll('li')) {
        if (/^\s*$/.test(node.textContent)) {
            node.classList.add('debug-border');
            node.setAttribute('title', 'Are you sure this paragraph should be empty?');
        }
    }
});
