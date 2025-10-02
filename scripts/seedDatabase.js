const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Blog = require('../models/Blog');

// Blog data from JSON
const blogsData = [
  {
    title: "A detailed step by step guide to manage your lifestyle",
    subTitle: "A Simple Step-by-Step Guide to Managing Your Lifestyle",
    description: "<h1>A Simple Step-by-Step Guide to Managing Your Lifestyle</h1><p>If you're looking to improve your health, boost productivity, and create a balanced life, managing your lifestyle intentionally is key. Here's a short guide to help you take control of your daily habits and overall well-being.</p><h2>1. Assess Your Current Lifestyle</h2><p>Track your habits for a week. Note your energy levels, sleep, diet, and daily routines. Reflect on what's working and what needs change.</p><h2>2. Focus on Health</h2><p>Eat balanced meals, stay hydrated, get enough sleep, and move your body daily. Mental health matters too—set boundaries and practice mindfulness.</p><h2>3. Set Clear Goals</h2><p>Break your goals into categories like health, career, and relationships. Make them specific and achievable.</p><h2>4. Create Daily Routines</h2><p>Establish morning and evening routines. Plan your days and weeks with intention using a planner or digital calendar.</p><h2>5. Manage Time Wisely</h2><p>Prioritize important tasks, limit distractions, and take regular breaks. Learn to say no when needed.</p><h2>6. Handle Finances Smartly</h2><p>Track your spending, set a budget, save regularly, and build financial literacy. Financial stability supports overall peace of mind.</p><h2>7. Build Strong Relationships</h2><p>Surround yourself with supportive people. Communicate openly and maintain healthy boundaries.</p><h2>8. Keep Learning</h2><p>Read, take online courses, or explore new hobbies. Personal growth keeps life fulfilling and dynamic.</p><h2>9. Declutter Regularly</h2><p>Simplify your physical and digital spaces. Clear surroundings help reduce stress and increase focus.</p><h2>10. Celebrate Small Wins</h2><p>Track your progress, reflect often, and reward yourself for sticking to positive habits. Consistency is more important than perfection.</p><p><strong>Final Tip</strong>: Start small, stay consistent, and review your lifestyle regularly. With steady effort, a well-managed lifestyle becomes second nature.</p>",
    category: "Lifestyle",
    tags: ["lifestyle", "productivity", "health", "wellness"],
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
  },
  {
    title: "How to create an effective startup roadmap or ideas",
    subTitle: "Creating an effective startup roadmap",
    description: "<p>Creating an effective <strong>startup roadmap</strong> helps you turn an idea into a structured, actionable plan. It gives clarity on what to build, when to build it, and how to scale. Here's a short and practical guide to help you build your startup roadmap or refine your startup ideas:</p><h2>1. <strong>Start with the Problem, Not the Product</strong></h2><ol><li>Identify a real, painful problem.</li><li>Validate that it affects a significant audience.</li><li>Ask: \"Is this a must-have or just nice to have?\"</li></ol><p><strong>Tip:</strong> Talk to real users, not just friends or family.</p><h2>2. <strong>Define Your Vision and Mission</strong></h2><ol><li>Vision: Long-term impact you want to make.</li><li>Mission: The approach or method to get there.</li></ol><p>This gives your roadmap a clear direction and purpose.</p><h2>3. <strong>Brainstorm and Filter Ideas</strong></h2><ol><li>List all possible solutions to the problem.</li><li>Evaluate each based on feasibility, market demand, uniqueness, and resources required.</li></ol><p>Focus on solutions that are both impactful and achievable.</p>",
    category: "Startup",
    tags: ["startup", "business", "planning", "entrepreneurship"],
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800"
  },
  {
    title: "The Future of Artificial Intelligence in Web Development",
    subTitle: "How AI is revolutionizing the way we build web applications",
    description: "<h1>The Future of Artificial Intelligence in Web Development</h1><p>Artificial Intelligence is transforming web development at an unprecedented pace. From automated code generation to intelligent user interfaces, AI is reshaping how developers approach building modern web applications.</p><h2>AI-Powered Development Tools</h2><p>Modern AI tools like GitHub Copilot, ChatGPT, and specialized coding assistants are becoming integral parts of the development workflow. These tools can generate code snippets, debug issues, and even create entire components based on natural language descriptions.</p><h2>Intelligent User Interfaces</h2><p>AI is enabling more personalized and adaptive user experiences. Machine learning algorithms can analyze user behavior patterns to customize content, predict user needs, and optimize interface layouts in real-time.</p><h2>Automated Testing and Quality Assurance</h2><p>AI-driven testing tools can automatically generate test cases, identify potential bugs, and perform comprehensive quality assurance checks. This reduces manual testing time and improves overall code quality.</p><h2>The Road Ahead</h2><p>As AI continues to evolve, we can expect even more sophisticated tools that will further streamline the development process. The key is to embrace these technologies while maintaining the creative and problem-solving aspects that make development an art.</p>",
    category: "Technology",
    tags: ["ai", "web development", "machine learning", "future tech"],
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
  },
  {
    title: "Personal Finance 101: Building Wealth in Your 20s and 30s",
    subTitle: "Essential financial strategies for young professionals",
    description: "<h1>Personal Finance 101: Building Wealth in Your 20s and 30s</h1><p>Your 20s and 30s are crucial decades for building a strong financial foundation. The decisions you make during this time can significantly impact your long-term wealth accumulation and financial security.</p><h2>Start with the Basics</h2><p>Before diving into investments, establish an emergency fund covering 3-6 months of expenses. Pay off high-interest debt, especially credit cards, as quickly as possible. These steps create a solid foundation for wealth building.</p><h2>The Power of Compound Interest</h2><p>Starting early is your biggest advantage. Even small amounts invested in your 20s can grow significantly over time thanks to compound interest. A $200 monthly investment starting at age 25 can be worth over $500,000 by retirement.</p><h2>Investment Strategies</h2><p>Consider low-cost index funds for broad market exposure. Take advantage of employer 401(k) matching - it's free money. As you gain experience, you can explore individual stocks, real estate, or other investment vehicles.</p><h2>Avoid Common Pitfalls</h2><p>Don't try to time the market or chase hot investment trends. Avoid lifestyle inflation as your income grows. Instead, increase your savings rate and maintain a long-term perspective on wealth building.</p>",
    category: "Finance",
    tags: ["personal finance", "investing", "wealth building", "financial planning"],
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800"
  },
  {
    title: "Mental Health in the Digital Age: Finding Balance",
    subTitle: "Strategies for maintaining mental wellness in our connected world",
    description: "<h1>Mental Health in the Digital Age: Finding Balance</h1><p>In our hyperconnected world, maintaining mental health has become increasingly challenging. The constant stream of notifications, social media comparisons, and digital overwhelm can take a significant toll on our psychological well-being.</p><h2>Understanding Digital Overwhelm</h2><p>Digital overwhelm occurs when we're exposed to more information and stimulation than we can effectively process. This can lead to anxiety, decreased focus, and a sense of being constantly 'on' without proper mental rest.</p><h2>Setting Healthy Boundaries</h2><p>Create designated phone-free zones and times in your day. Use app timers to limit social media usage. Practice the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain and mental fatigue.</p><h2>Mindfulness and Digital Detox</h2><p>Regular digital detoxes, even for short periods, can help reset your mental state. Practice mindfulness meditation to improve focus and reduce anxiety. Consider apps that promote mental wellness rather than endless scrolling.</p><h2>Building Real Connections</h2><p>While digital connections have their place, prioritize face-to-face interactions and activities that don't involve screens. Engage in hobbies, exercise, or spend time in nature to maintain a healthy balance.</p>",
    category: "Health",
    tags: ["mental health", "digital wellness", "mindfulness", "work-life balance"],
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800"
  },
  {
    title: "Hidden Gems: Off-the-Beaten-Path Destinations in Southeast Asia",
    subTitle: "Discover incredible places beyond the tourist crowds",
    description: "<h1>Hidden Gems: Off-the-Beaten-Path Destinations in Southeast Asia</h1><p>Southeast Asia offers incredible diversity beyond the popular tourist destinations. These hidden gems provide authentic cultural experiences, stunning natural beauty, and the chance to explore places that haven't been overrun by mass tourism.</p><h2>Koh Rong Sanloem, Cambodia</h2><p>While Koh Rong gets most of the attention, its smaller neighbor Koh Rong Sanloem offers pristine beaches with crystal-clear waters and a more relaxed atmosphere. Perfect for those seeking tranquility and natural beauty without the party scene.</p><h2>Flores Island, Indonesia</h2><p>Beyond Bali lies Flores, home to the famous Komodo dragons and some of Indonesia's most spectacular landscapes. The island features colorful crater lakes, traditional villages, and world-class diving opportunities.</p><h2>Kampot, Cambodia</h2><p>This charming riverside town is famous for its pepper plantations and French colonial architecture. Kampot offers a slower pace of life, excellent local cuisine, and easy access to Bokor National Park's misty mountains.</p><h2>Con Dao Islands, Vietnam</h2><p>Once a prison island, Con Dao has transformed into a pristine marine sanctuary. With excellent diving, sea turtle nesting sites, and historical significance, it offers a unique blend of nature and history.</p>",
    category: "Travel",
    tags: ["travel", "southeast asia", "hidden gems", "adventure"],
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
  },
  {
    title: "The Art of Fermentation: Ancient Techniques for Modern Kitchens",
    subTitle: "Exploring the world of fermented foods and their health benefits",
    description: "<h1>The Art of Fermentation: Ancient Techniques for Modern Kitchens</h1><p>Fermentation is one of humanity's oldest food preservation methods, and it's experiencing a renaissance in modern kitchens. Beyond preservation, fermented foods offer incredible health benefits and complex flavors that can transform your cooking.</p><h2>Health Benefits of Fermented Foods</h2><p>Fermented foods are rich in probiotics, which support gut health and boost immune function. Regular consumption of fermented foods has been linked to improved digestion, better mental health, and enhanced nutrient absorption.</p><h2>Getting Started: Simple Fermentation Projects</h2><p>Begin with easy projects like sauerkraut, kimchi, or kombucha. These require minimal equipment and are forgiving for beginners. Start small and gradually expand your fermentation repertoire as you gain confidence.</p><h2>Essential Equipment and Safety</h2><p>You don't need expensive equipment to start fermenting. Mason jars, a kitchen scale, and quality salt are the basics. Always maintain proper hygiene and follow tested recipes to ensure safe fermentation.</p><h2>Exploring Global Fermentation Traditions</h2><p>Every culture has its fermentation traditions - from Japanese miso to Ethiopian injera. Exploring these diverse techniques can add exciting new flavors and techniques to your culinary arsenal.</p>",
    category: "Food",
    tags: ["fermentation", "healthy eating", "cooking", "probiotics"],
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"
  },
  {
    title: "The Rise of Remote Learning: Transforming Education Forever",
    subTitle: "How digital education is reshaping the learning landscape",
    description: "<h1>The Rise of Remote Learning: Transforming Education Forever</h1><p>The global shift to remote learning has accelerated educational innovation and challenged traditional teaching methods. This transformation is creating new opportunities for personalized, accessible, and flexible education.</p><h2>Technology as an Enabler</h2><p>Advanced learning management systems, virtual reality, and AI-powered tutoring are making remote learning more engaging and effective. These tools can adapt to individual learning styles and provide instant feedback to students.</p><h2>Benefits of Remote Learning</h2><p>Remote learning offers unprecedented flexibility, allowing students to learn at their own pace and schedule. It also provides access to world-class educators and courses regardless of geographic location, democratizing quality education.</p><h2>Challenges and Solutions</h2><p>While remote learning offers many benefits, it also presents challenges like reduced social interaction and the need for strong self-discipline. Successful programs address these issues through virtual collaboration tools and structured support systems.</p><h2>The Future of Hybrid Education</h2><p>The future likely holds a hybrid model combining the best of in-person and remote learning. This approach can provide flexibility while maintaining the social and collaborative aspects of traditional education.</p>",
    category: "Education",
    tags: ["remote learning", "education technology", "online courses", "digital transformation"],
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800"
  },
  {
    title: "Blockchain Beyond Cryptocurrency: Real-World Applications",
    subTitle: "Exploring practical uses of blockchain technology across industries",
    description: "<h1>Blockchain Beyond Cryptocurrency: Real-World Applications</h1><p>While cryptocurrency brought blockchain into the spotlight, the technology's potential extends far beyond digital currencies. Industries worldwide are discovering innovative ways to leverage blockchain's transparency, security, and decentralization.</p><h2>Supply Chain Management</h2><p>Blockchain provides end-to-end traceability in supply chains, allowing consumers to verify product authenticity and origin. Companies like Walmart use blockchain to track food products from farm to shelf, enabling rapid response to contamination issues.</p><h2>Healthcare Data Management</h2><p>Blockchain can secure patient data while enabling authorized access across healthcare providers. This creates a comprehensive, tamper-proof medical record system that patients control, improving care coordination and reducing medical errors.</p><h2>Digital Identity Verification</h2><p>Blockchain-based identity systems give individuals control over their personal data while providing secure, verifiable credentials. This could eliminate the need for multiple passwords and reduce identity theft risks.</p><h2>Smart Contracts and Automation</h2><p>Smart contracts automatically execute agreements when predetermined conditions are met, reducing the need for intermediaries and increasing efficiency in various business processes.</p>",
    category: "Technology",
    tags: ["blockchain", "technology", "innovation", "digital transformation"],
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
  },
  {
    title: "Sustainable Living: Small Changes, Big Impact",
    subTitle: "Practical steps toward an eco-friendly lifestyle",
    description: "<h1>Sustainable Living: Small Changes, Big Impact</h1><p>Living sustainably doesn't require dramatic lifestyle changes. Small, consistent actions can significantly reduce your environmental footprint while often saving money and improving your quality of life.</p><h2>Energy Efficiency at Home</h2><p>Simple changes like switching to LED bulbs, unplugging devices when not in use, and adjusting your thermostat can reduce energy consumption by 20-30%. Consider a programmable thermostat and energy-efficient appliances for larger savings.</p><h2>Sustainable Transportation</h2><p>Walk, bike, or use public transportation when possible. If you need a car, consider carpooling, electric vehicles, or hybrid options. Even combining errands into single trips can reduce your carbon footprint significantly.</p><h2>Mindful Consumption</h2><p>Buy only what you need, choose quality items that last longer, and support companies with sustainable practices. Consider the lifecycle of products before purchasing and opt for items with minimal packaging.</p><h2>Waste Reduction Strategies</h2><p>Implement the 5 R's: Refuse, Reduce, Reuse, Recycle, and Rot (compost). Start composting organic waste, use reusable bags and containers, and properly recycle electronics and hazardous materials.</p>",
    category: "Lifestyle",
    tags: ["sustainability", "eco-friendly", "green living", "environmental"],
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Blog.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@blogsite.com',
      password: 'Admin123!',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create regular users
    const users = [];
    const userNames = ['Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Wilson', 'David Park'];
    
    for (let i = 0; i < userNames.length; i++) {
      const user = new User({
        name: userNames[i],
        email: `user${i + 1}@blogsite.com`,
        password: 'User123!',
        role: 'user'
      });
      await user.save();
      users.push(user);
    }
    console.log('Created regular users');

    // Create blogs
    for (let i = 0; i < blogsData.length; i++) {
      const blogData = blogsData[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const blog = new Blog({
        ...blogData,
        author: randomUser._id,
        authorName: randomUser.name,
        isPublished: true,
        isDraft: false,
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
      
      await blog.save();
    }
    console.log('Created blogs');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@blogsite.com / Admin123!');
    console.log('Users: user1@blogsite.com to user5@blogsite.com / User123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
