
document.addEventListener('DOMContentLoaded', function() {
    let node;

    for (node of document.querySelectorAll('p')) {
        if (/^\s*$/.test(node.textContent)) {
            node.classList.add('debug');
            node.setAttribute('title', 'Are you sure this paragraph should be empty?');
        }
    }

    for (node of document.querySelectorAll('li')) {
        if (/^\s*$/.test(node.textContent)) {
            node.classList.add('debug');
            node.setAttribute('title', 'Are you sure this li should be empty?');
        }
    }

    for (node of document.querySelectorAll('button:not([type])')) {
        if (/^\s*$/.test(node.textContent)) {
            node.classList.add('debug');
            node.setAttribute('title', 'Buttons should really have a type, or they default to type="submit".');
        }
    }
});
