document.addEventListener('DOMContentLoaded', () => {
    const productListContainer = document.getElementById('product-list-container');
    const categoryFilter = document.getElementById('category-filter');
    const productSearchInput = document.getElementById('product-search');
    const searchBtn = document.getElementById('search-btn');
    const productModal = document.getElementById('productModal');
    const closeModalButton = document.querySelector('.modal .close-button');

    // For "Request a Quote" page product dropdown
    const quoteProductSelection = document.getElementById('productSelection');


    let allProducts = []; // To store all fetched products

    async function fetchProducts() {
        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const productsData = await response.json();
            allProducts = [...productsData.manufactured, ...productsData.imported];
            // Add category property to each product for easier filtering
            allProducts.forEach(p => {
                if (productsData.manufactured.includes(p)) p.categoryType = 'manufactured';
                if (productsData.imported.includes(p)) p.categoryType = 'imported';
            });

            displayProducts(allProducts);

            // Populate quote form product dropdown if on that page
            if (quoteProductSelection) {
                populateQuoteProductDropdown(allProducts);
            }

        } catch (error) {
            console.error("Could not fetch products:", error);
            if(productListContainer) productListContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again later.</p>';
        }
    }

    function displayProducts(productsToDisplay) {
        if (!productListContainer) return; // Only run on pages with product list

        productListContainer.innerHTML = ''; // Clear previous products or loading message

        if (productsToDisplay.length === 0) {
            productListContainer.innerHTML = '<p class="no-results-message">No products found matching your criteria.</p>';
            return;
        }

        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.setAttribute('id', product.id); // Set ID for anchor linking from home page

            // Use a placeholder if image is not available
            const productImage = product.image || 'images/product-placeholder.jpg';

            productCard.innerHTML = `
                <img src="${productImage}" alt="${product.name}" loading="lazy">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <span class="product-category-tag">${product.categoryType === 'manufactured' ? 'Manufactured' : 'Imported'}</span>
                    <p>${truncateText(product.description, 100)}</p>
                    <button class="cta-button view-details-btn" data-product-id="${product.id}">View Details</button>
                </div>
            `;
            productListContainer.appendChild(productCard);
        });

        // Add event listeners to "View Details" buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                const product = allProducts.find(p => p.id === productId);
                if (product) {
                    openProductModal(product);
                }
            });
        });
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function formatProductDetail(detail) {
        if (typeof detail === 'object' && detail !== null) {
            // Handle objects like 'sizes' for SiC Filters
            if (detail.Square && detail.Round && detail.Thickness && detail.PoreSizes) {
                 return `Square: ${detail.Square}, Round: ${detail.Round}, Thickness: ${detail.Thickness}, Pore sizes: ${detail.PoreSizes}`;
            }
            if (detail.Fine && detail.Medium && detail.Coarse) { // GPC Sizes
                return `Fine: ${detail.Fine}, Medium: ${detail.Medium}, Coarse: ${detail.Coarse}`;
            }
            if(detail.Diameter && detail.Length) { // Graphite Electrodes
                return `Diameter: ${detail.Diameter}, Length: ${detail.Length}`;
            }
            return JSON.stringify(detail); // Fallback for other objects
        }
        if (Array.isArray(detail)) {
            return `<ul>${detail.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
        return `<p>${detail}</p>`;
    }


    function openProductModal(product) {
        if (!productModal) return;

        document.getElementById('modalProductName').textContent = product.name;
        const detailsContainer = document.getElementById('modalProductDetails');
        detailsContainer.innerHTML = ''; // Clear previous details

        // Use placeholder if image is not available
        const modalProductImage = product.image || 'images/product-placeholder.jpg';
        document.getElementById('modalImage').src = modalProductImage;
        document.getElementById('modalImage').alt = product.name;


        // Dynamically create HTML for product details based on brochure structure
        // General description if available
        if (product.description) {
            detailsContainer.innerHTML += `<h4>Overview</h4><p>${product.description}</p>`;
        }

        // Specific fields as per brochure
        const detailFields = {
            "Exothermic & Insulating Sleeves": ["reaction_type", "temperature_distribution", "versatile_sizes", "applications", "advantages"],
            "Silicon Carbide Ceramic Foam Filters (SiC Filters)": ["filtration_efficiency", "thermal_stability", "sizes", "applications", "advantages"],
            "Core Fix (Core Paste)": ["properties", "applications", "advantages"],
            "Ceramic Filters": ["features", "benefits"],
            "Perlite Ore (Slag Remover & Insulator)": ["applications", "sizes_perlite", "pore_hole_perlite"], // Renamed to avoid clash
            "GPC (Graphite Petroleum Coke / Artificial Graphite)": ["carbon_content", "size_grades_gpc"], // Renamed
            "Graphite Electrodes": ["features_electrodes", "size_range_electrodes", "applications"], // Renamed
            "Steel Shots": ["material", "grain_size", "features_steel_shots"], // Renamed
            "Aluminum Paint / Coat": ["features_paint"], // Renamed
            "APC Powder (Anti-Piping Compound)": ["properties_apc"], // Renamed
            "Foundry Chaplets": ["types_chaplets", "features_chaplets"], // Renamed
            "Core Box Air Vents": ["types_vents", "sizes_vents"], // Renamed
            "Plastic Foundry Pattern Letters": ["material_letters", "features_letters", "custom_sizes_letters"] // Renamed
        };

        const fieldsToDisplay = detailFields[product.name] || Object.keys(product.details);

        fieldsToDisplay.forEach(key => {
            if (product.details[key]) {
                const keyName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Prettify key name
                 // Handle specific renamed keys for display
                let displayKeyName = keyName;
                if (key === "sizes_perlite") displayKeyName = "Sizes";
                if (key === "pore_hole_perlite") displayKeyName = "Pore Hole";
                if (key === "size_grades_gpc") displayKeyName = "Size Grades";
                if (key === "features_electrodes") displayKeyName = "Features";
                if (key === "size_range_electrodes") displayKeyName = "Size Range";
                if (key === "features_steel_shots") displayKeyName = "Features";
                if (key === "features_paint") displayKeyName = "Features";
                if (key === "properties_apc") displayKeyName = "Properties";
                if (key === "types_chaplets") displayKeyName = "Types";
                if (key === "features_chaplets") displayKeyName = "Features";
                if (key === "types_vents") displayKeyName = "Types";
                if (key === "sizes_vents") displayKeyName = "Sizes";
                if (key === "material_letters") displayKeyName = "Material";
                if (key === "features_letters") displayKeyName = "Features";
                if (key === "custom_sizes_letters") displayKeyName = "Custom Sizes";


                detailsContainer.innerHTML += `<h4>${displayKeyName}</h4>${formatProductDetail(product.details[key])}`;
            }
        });

        productModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeProductModal() {
        if (!productModal) return;
        productModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeProductModal);
    }
    if (productModal) {
        window.addEventListener('click', (event) => {
            if (event.target === productModal) {
                closeProductModal();
            }
        });
    }
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === "Escape" && productModal && productModal.style.display === 'block') {
            closeProductModal();
        }
    });


    function filterAndSearchProducts() {
        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const searchTerm = productSearchInput ? productSearchInput.value.toLowerCase() : '';

        let filteredProducts = allProducts;

        // Filter by category
        if (categoryValue !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.categoryType === categoryValue);
        }

        // Filter by search term (name and description)
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.id && product.id.toLowerCase().includes(searchTerm.replace(/\s+/g, '-'))) // search by ID (e.g. "exothermic-sleeves")
            );
        }
        displayProducts(filteredProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndSearchProducts);
    }
    if (productSearchInput) {
        productSearchInput.addEventListener('input', filterAndSearchProducts); // Live search
    }
    if (searchBtn) { // If you prefer a button click for search
        searchBtn.addEventListener('click', filterAndSearchProducts);
    }

    // Function to populate product dropdown on Request a Quote page
    function populateQuoteProductDropdown(products) {
        if (!quoteProductSelection) return;
        quoteProductSelection.innerHTML = '<option value="">-- Select a Product --</option>'; // Clear existing and add default

        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id; // Use product ID as value
            option.textContent = product.name;
            quoteProductSelection.appendChild(option);
        });
    }


    // Initial fetch
    fetchProducts().then(() => {
        // Check for URL hash and scroll to product or open modal
        if (window.location.hash && productListContainer) {
            const productIdFromHash = window.location.hash.substring(1); // Remove #
            const productElement = document.getElementById(productIdFromHash);
            if (productElement) {
                productElement.scrollIntoView({ behavior: 'smooth' });
                // Optionally, open modal directly if desired
                const productToOpen = allProducts.find(p => p.id === productIdFromHash);
                if(productToOpen) {
                    // Small delay to ensure page is settled after scroll
                    setTimeout(() => openProductModal(productToOpen), 300);
                }
            }
        }
    });

}); // End DOMContentLoaded