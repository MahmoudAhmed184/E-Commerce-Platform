from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.products.models import Category, Product, ProductImage
import random
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds the database with fake categories and products'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Categories
        categories_data = [
            {'name': 'Electronics', 'description': 'Gadgets, phones, and computers'},
            {'name': 'Clothing', 'description': 'Men and women apparel'},
            {'name': 'Home & Kitchen', 'description': 'Furniture and kitchen appliances'},
            {'name': 'Books', 'description': 'Fiction, non-fiction, and textbooks'},
            {'name': 'Sports', 'description': 'Sporting goods and equipment'},
        ]

        categories = {}
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description'], 'is_active': True}
            )
            categories[cat.name] = cat
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {cat.name}'))

        # Products
        products_data = [
            # Electronics
            {'name': 'Smartphone Pro Max', 'category': 'Electronics', 'price': '999.99', 'stock': 50, 'desc': 'Latest flagship smartphone with amazing camera.'},
            {'name': 'Wireless Noise Cancelling Headphones', 'category': 'Electronics', 'price': '299.99', 'stock': 120, 'desc': 'Premium over-ear headphones with active noise cancellation.'},
            {'name': '4K Ultra HD Smart TV', 'category': 'Electronics', 'price': '799.00', 'stock': 30, 'desc': '65-inch 4K TV with vivid colors and smart features.'},
            {'name': 'Gaming Laptop RTX 4080', 'category': 'Electronics', 'price': '2199.50', 'stock': 15, 'desc': 'High-performance laptop for hardcore gamers and creators.'},
            {'name': 'Smartwatch Series 8', 'category': 'Electronics', 'price': '399.00', 'stock': 80, 'desc': 'Fitness tracking, heart rate monitoring, and cellular connectivity.'},
            
            # Clothing
            {'name': 'Classic Cotton T-Shirt', 'category': 'Clothing', 'price': '19.99', 'stock': 200, 'desc': 'Comfortable 100% cotton t-shirt in various colors.'},
            {'name': 'Slim Fit Denim Jeans', 'category': 'Clothing', 'price': '49.99', 'stock': 150, 'desc': 'Stylish slim fit jeans for everyday wear.'},
            {'name': 'Winter Puffer Jacket', 'category': 'Clothing', 'price': '89.50', 'stock': 60, 'desc': 'Warm and water-resistant jacket for cold weather.'},
            {'name': 'Running Sneakers', 'category': 'Clothing', 'price': '120.00', 'stock': 90, 'desc': 'Lightweight and breathable sneakers for runners.'},
            {'name': 'Formal Leather Belt', 'category': 'Clothing', 'price': '35.00', 'stock': 100, 'desc': 'Genuine leather belt with a classic buckle.'},

            # Home & Kitchen
            {'name': 'Non-Stick Cookware Set', 'category': 'Home & Kitchen', 'price': '149.99', 'stock': 40, 'desc': '10-piece aluminum cookware set with glass lids.'},
            {'name': 'Robot Vacuum Cleaner', 'category': 'Home & Kitchen', 'price': '249.00', 'stock': 25, 'desc': 'Smart vacuum cleaner with app control and self-charging.'},
            {'name': 'Ergonomic Office Chair', 'category': 'Home & Kitchen', 'price': '180.00', 'stock': 55, 'desc': 'Comfortable chair with lumbar support and adjustable height.'},
            {'name': 'Ceramic Coffee Mug', 'category': 'Home & Kitchen', 'price': '12.50', 'stock': 300, 'desc': 'Minimalist design ceramic mug, 12oz capacity.'},
            {'name': 'Memory Foam Mattress', 'category': 'Home & Kitchen', 'price': '450.00', 'stock': 10, 'desc': 'Queen size mattress with cooling gel technology.'},

            # Books
            {'name': 'The Great Gatsby', 'category': 'Books', 'price': '10.99', 'stock': 100, 'desc': 'Classic novel by F. Scott Fitzgerald.'},
            {'name': 'Python Crash Course', 'category': 'Books', 'price': '29.99', 'stock': 80, 'desc': 'A hands-on, project-based introduction to programming.'},
            {'name': 'Atomic Habits', 'category': 'Books', 'price': '16.50', 'stock': 150, 'desc': 'An easy and proven way to build good habits and break bad ones.'},
            {'name': 'Sapiens: A Brief History of Humankind', 'category': 'Books', 'price': '22.00', 'stock': 65, 'desc': 'Explore the history of our species by Yuval Noah Harari.'},
            {'name': 'The Art of War', 'category': 'Books', 'price': '8.50', 'stock': 120, 'desc': 'Ancient Chinese military treatise attributed to Sun Tzu.'},

            # Sports
            {'name': 'Yoga Mat with Alignment Lines', 'category': 'Sports', 'price': '25.00', 'stock': 140, 'desc': 'Eco-friendly TPE yoga mat with carrying strap.'},
            {'name': 'Adjustable Dumbbell Set', 'category': 'Sports', 'price': '199.00', 'stock': 20, 'desc': 'Space-saving dumbbells, adjustable up to 52.5 lbs each.'},
            {'name': 'Tennis Racket Pro', 'category': 'Sports', 'price': '150.00', 'stock': 45, 'desc': 'Lightweight graphite racket for advanced players.'},
            {'name': 'Camping Tent 4-Person', 'category': 'Sports', 'price': '110.00', 'stock': 35, 'desc': 'Waterproof family tent with easy setup.'},
            {'name': 'Mountain Bike 21-Speed', 'category': 'Sports', 'price': '350.00', 'stock': 12, 'desc': 'Durable mountain bike with dual suspension and disc brakes.'},
        ]

        # Dummy images to randomly assign
        dummy_images = [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
            'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
        ]

        for p_data in products_data:
            category = categories[p_data['category']]
            product, created = Product.objects.get_or_create(
                name=p_data['name'],
                defaults={
                    'category': category,
                    'description': p_data['desc'],
                    'price': Decimal(p_data['price']),
                    'stock': p_data['stock'],
                    'is_active': True
                }
            )

            if created:
                # Add 1-2 dummy images
                num_images = random.randint(1, 2)
                selected_images = random.sample(dummy_images, num_images)
                
                for idx, img_url in enumerate(selected_images):
                    ProductImage.objects.create(
                        product=product,
                        image=img_url,
                        is_primary=(idx == 0)
                    )
                self.stdout.write(self.style.SUCCESS(f'Created product: {product.name}'))

        self.stdout.write(self.style.SUCCESS('Database successfully seeded with fake data!'))
