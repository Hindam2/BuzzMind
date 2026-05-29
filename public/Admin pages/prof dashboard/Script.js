document.addEventListener('DOMContentLoaded', () => {
    // Add click interaction for Class Cards
    const classCards = document.querySelectorAll('.class-item');
    
    classCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const className = card.querySelector('h4').innerText;
            alert(`Opening course dashboard for: ${className}`);
        });
    });
});