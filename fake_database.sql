-- Comprehensive Fake Database for Inspect Design Testing
-- This creates extensive test data to showcase different UI states and sentiment patterns

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM reactions;
-- DELETE FROM comments;
-- DELETE FROM evidence;
-- DELETE FROM insight_links;
-- DELETE FROM summaries;
-- DELETE FROM insights;
-- DELETE FROM sources;
-- DELETE FROM users;

-- Insert test users
INSERT INTO users (id, username, email, password, avatar_uri, profile, verified) VALUES
(1, 'alex_researcher', 'alex@example.com', 'hashed_password_1', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'AI researcher focused on machine learning ethics', true),
(2, 'sarah_analyst', 'sarah@example.com', 'hashed_password_2', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'Data analyst specializing in social media trends', true),
(3, 'mike_developer', 'mike@example.com', 'hashed_password_3', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'Full-stack developer passionate about clean code', true),
(4, 'emma_designer', 'emma@example.com', 'hashed_password_4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', 'UX designer with expertise in accessibility', true),
(5, 'david_scientist', 'david@example.com', 'hashed_password_5', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 'Climate scientist studying renewable energy', true),
(6, 'lisa_entrepreneur', 'lisa@example.com', 'hashed_password_6', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa', 'Startup founder in the fintech space', true),
(7, 'james_educator', 'james@example.com', 'hashed_password_7', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 'Computer science professor and researcher', true),
(8, 'maria_consultant', 'maria@example.com', 'hashed_password_8', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', 'Management consultant specializing in digital transformation', true);

-- Insert test sources
INSERT INTO sources (id, baseurl, logo_uri) VALUES
(1, 'nature.com', 'https://www.nature.com/favicon.ico'),
(2, 'arxiv.org', 'https://arxiv.org/favicon.ico'),
(3, 'github.com', 'https://github.com/favicon.ico'),
(4, 'stackoverflow.com', 'https://stackoverflow.com/favicon.ico'),
(5, 'techcrunch.com', 'https://techcrunch.com/favicon.ico'),
(6, 'wired.com', 'https://www.wired.com/favicon.ico'),
(7, 'mit.edu', 'https://web.mit.edu/favicon.ico'),
(8, 'stanford.edu', 'https://www.stanford.edu/favicon.ico'),
(9, 'medium.com', 'https://medium.com/favicon.ico'),
(10, 'ycombinator.com', 'https://www.ycombinator.com/favicon.ico');

-- Insert test summaries (evidence sources)
INSERT INTO summaries (id, url, title, source_id, uid, original_title, created_at, updated_at) VALUES
-- AI/ML Research Papers
(1, 'https://nature.com/articles/ai-ethics-2024', 'Ethical Implications of Large Language Models in Healthcare', 1, 'nature-ai-ethics-2024', 'Ethical Implications of Large Language Models in Healthcare', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
(2, 'https://arxiv.org/abs/2401.12345', 'Transformer Architecture Improvements for Multimodal Learning', 2, 'arxiv-transformer-multimodal-2024', 'Transformer Architecture Improvements for Multimodal Learning', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
(3, 'https://github.com/microsoft/vscode', 'Visual Studio Code: Open Source Code Editor', 3, 'github-vscode', 'Visual Studio Code: Open Source Code Editor', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
(4, 'https://stackoverflow.com/questions/ai-best-practices', 'Best Practices for AI Model Deployment in Production', 4, 'stackoverflow-ai-deployment', 'Best Practices for AI Model Deployment in Production', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

-- Climate Science
(5, 'https://nature.com/articles/climate-renewable-2024', 'Renewable Energy Breakthrough: Solar Panel Efficiency Reaches 50%', 1, 'nature-solar-efficiency-2024', 'Renewable Energy Breakthrough: Solar Panel Efficiency Reaches 50%', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days'),
(6, 'https://mit.edu/news/climate-carbon-capture', 'MIT Researchers Develop Novel Carbon Capture Technology', 7, 'mit-carbon-capture-2024', 'MIT Researchers Develop Novel Carbon Capture Technology', NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 days'),

-- Technology Trends
(7, 'https://techcrunch.com/quantum-computing-2024', 'Quantum Computing Milestone: IBM Achieves Quantum Advantage', 5, 'techcrunch-quantum-ibm-2024', 'Quantum Computing Milestone: IBM Achieves Quantum Advantage', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
(8, 'https://wired.com/cybersecurity-threats-2024', 'Cybersecurity Threats Reach All-Time High in 2024', 6, 'wired-cybersecurity-2024', 'Cybersecurity Threats Reach All-Time High in 2024', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

-- Startup/Entrepreneurship
(9, 'https://ycombinator.com/blog/startup-funding-2024', 'Y Combinator Announces Record-Breaking Funding Round', 10, 'ycombinator-funding-2024', 'Y Combinator Announces Record-Breaking Funding Round', NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days'),
(10, 'https://medium.com/@founder/startup-lessons', '10 Lessons Learned from Building a Successful SaaS Startup', 9, 'medium-saas-lessons', '10 Lessons Learned from Building a Successful SaaS Startup', NOW() - INTERVAL '11 days', NOW() - INTERVAL '5 days'),

-- Education/Research
(11, 'https://stanford.edu/news/computer-science-education', 'Stanford Launches New Computer Science Curriculum for AI Era', 8, 'stanford-cs-curriculum-2024', 'Stanford Launches New Computer Science Curriculum for AI Era', NOW() - INTERVAL '12 days', NOW() - INTERVAL '6 days'),
(12, 'https://github.com/tensorflow/tensorflow', 'TensorFlow 2.15 Release Notes and New Features', 3, 'github-tensorflow-2-15', 'TensorFlow 2.15 Release Notes and New Features', NOW() - INTERVAL '13 days', NOW() - INTERVAL '7 days');

-- Insert test insights with diverse emotional sentiment patterns
INSERT INTO insights (id, user_id, uid, title, is_public, created_at, updated_at) VALUES
-- High-engagement insights with positive sentiment
(1, 1, 'insight-ai-ethics-healthcare', 'AI Ethics in Healthcare: Balancing Innovation with Patient Safety', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
(2, 2, 'insight-social-media-trends', 'Social Media Trends: The Rise of Authentic Content in 2024', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
(3, 3, 'insight-clean-code-practices', 'Clean Code Practices: Why They Matter More Than Ever', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'),

-- Controversial insights with mixed sentiment
(4, 4, 'insight-accessibility-design', 'Accessibility in Design: Beyond Compliance to True Inclusion', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days'),
(5, 5, 'insight-climate-renewable', 'Renewable Energy: The Path to Carbon Neutrality by 2030', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days'),

-- Technical insights with neutral sentiment
(6, 6, 'insight-fintech-startup', 'Fintech Startup Challenges: Regulatory Compliance vs Innovation', true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '6 days'),
(7, 7, 'insight-computer-science-education', 'Computer Science Education: Preparing Students for AI-Driven Future', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'),

-- Personal/opinion insights with emotional sentiment
(8, 8, 'insight-digital-transformation', 'Digital Transformation: Why Most Companies Fail and How to Succeed', true, NOW() - INTERVAL '11 days', NOW() - INTERVAL '8 days'),
(9, 1, 'insight-machine-learning-bias', 'Machine Learning Bias: The Hidden Dangers in Algorithmic Decision Making', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days'),
(10, 2, 'insight-data-privacy', 'Data Privacy in the Age of Big Data: A User Perspective', true, NOW() - INTERVAL '13 days', NOW() - INTERVAL '10 days'),

-- Child insights (for hierarchical relationships)
(11, 3, 'insight-code-review-process', 'Code Review Process: Best Practices for Team Collaboration', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(12, 4, 'insight-ui-accessibility', 'UI Accessibility: Designing for Users with Visual Impairments', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(13, 5, 'insight-solar-technology', 'Solar Technology Breakthrough: Implications for Global Energy', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert insight links (parent-child relationships)
INSERT INTO insight_links (id, parent_id, child_id) VALUES
-- Main insights with children
(1, 3, 11), -- Clean Code Practices -> Code Review Process
(2, 4, 12), -- Accessibility in Design -> UI Accessibility
(3, 5, 13), -- Renewable Energy -> Solar Technology

-- Cross-domain relationships
(4, 1, 9),  -- AI Ethics -> Machine Learning Bias
(5, 2, 10), -- Social Media Trends -> Data Privacy
(6, 6, 8);  -- Fintech Startup -> Digital Transformation

-- Insert evidence (insight-summary relationships)
INSERT INTO evidence (id, insight_id, summary_id) VALUES
-- AI Ethics insight evidence
(1, 1, 1), -- AI Ethics -> Nature AI Ethics paper
(2, 1, 2), -- AI Ethics -> ArXiv Transformer paper
(3, 1, 4), -- AI Ethics -> StackOverflow AI practices

-- Social Media Trends insight evidence
(4, 2, 7), -- Social Media -> TechCrunch Quantum article
(5, 2, 8), -- Social Media -> Wired Cybersecurity article

-- Clean Code insight evidence
(6, 3, 3), -- Clean Code -> GitHub VSCode
(7, 3, 4), -- Clean Code -> StackOverflow AI practices

-- Accessibility insight evidence
(8, 4, 11), -- Accessibility -> Stanford CS curriculum
(9, 4, 12), -- Accessibility -> TensorFlow release

-- Climate/Renewable insight evidence
(10, 5, 5), -- Climate -> Nature Solar efficiency
(11, 5, 6), -- Climate -> MIT Carbon capture

-- Fintech insight evidence
(12, 6, 9), -- Fintech -> Y Combinator funding
(13, 6, 10), -- Fintech -> Medium SaaS lessons

-- Education insight evidence
(14, 7, 11), -- Education -> Stanford CS curriculum
(15, 7, 12), -- Education -> TensorFlow release

-- Digital Transformation insight evidence
(16, 8, 9), -- Digital -> Y Combinator funding
(17, 8, 10), -- Digital -> Medium SaaS lessons

-- Machine Learning Bias insight evidence
(18, 9, 1), -- ML Bias -> Nature AI ethics
(19, 9, 2), -- ML Bias -> ArXiv Transformer

-- Data Privacy insight evidence
(20, 10, 7), -- Privacy -> TechCrunch Quantum
(21, 10, 8), -- Privacy -> Wired Cybersecurity

-- Child insights evidence
(22, 11, 3), -- Code Review -> GitHub VSCode
(23, 12, 11), -- UI Accessibility -> Stanford CS
(24, 13, 5); -- Solar Tech -> Nature Solar

-- Insert reactions with diverse emotional sentiment patterns
INSERT INTO reactions (id, reaction, user_id, insight_id, created_at) VALUES
-- Insight 1: AI Ethics (mostly positive sentiment)
(1, '🤔', 2, 1, NOW() - INTERVAL '4 days'),
(2, '👍', 3, 1, NOW() - INTERVAL '4 days'),
(3, '❤️', 4, 1, NOW() - INTERVAL '3 days'),
(4, '🎯', 5, 1, NOW() - INTERVAL '3 days'),
(5, '👏', 6, 1, NOW() - INTERVAL '2 days'),
(6, '🤔', 7, 1, NOW() - INTERVAL '2 days'),
(7, '👍', 8, 1, NOW() - INTERVAL '1 day'),

-- Insight 2: Social Media Trends (mixed sentiment)
(8, '😊', 1, 2, NOW() - INTERVAL '3 days'),
(9, '🤔', 3, 2, NOW() - INTERVAL '3 days'),
(10, '😮', 4, 2, NOW() - INTERVAL '2 days'),
(11, '👍', 5, 2, NOW() - INTERVAL '2 days'),
(12, '😕', 6, 2, NOW() - INTERVAL '1 day'),

-- Insight 3: Clean Code (very positive sentiment)
(13, '❤️', 1, 3, NOW() - INTERVAL '5 days'),
(14, '👏', 2, 3, NOW() - INTERVAL '5 days'),
(15, '🎯', 4, 3, NOW() - INTERVAL '4 days'),
(16, '👍', 5, 3, NOW() - INTERVAL '4 days'),
(17, '❤️', 6, 3, NOW() - INTERVAL '3 days'),
(18, '👏', 7, 3, NOW() - INTERVAL '3 days'),
(19, '🎯', 8, 3, NOW() - INTERVAL '2 days'),
(20, '👍', 1, 3, NOW() - INTERVAL '2 days'),
(21, '❤️', 2, 3, NOW() - INTERVAL '1 day'),

-- Insight 4: Accessibility (controversial - mixed sentiment)
(22, '🤔', 1, 4, NOW() - INTERVAL '6 days'),
(23, '😕', 2, 4, NOW() - INTERVAL '6 days'),
(24, '❤️', 3, 4, NOW() - INTERVAL '5 days'),
(25, '👍', 5, 4, NOW() - INTERVAL '5 days'),
(26, '😮', 6, 4, NOW() - INTERVAL '4 days'),
(27, '🤔', 7, 4, NOW() - INTERVAL '4 days'),
(28, '😊', 8, 4, NOW() - INTERVAL '3 days'),

-- Insight 5: Climate/Renewable (very positive sentiment)
(29, '🌱', 1, 5, NOW() - INTERVAL '7 days'),
(30, '❤️', 2, 5, NOW() - INTERVAL '7 days'),
(31, '👏', 3, 5, NOW() - INTERVAL '6 days'),
(32, '🌱', 4, 5, NOW() - INTERVAL '6 days'),
(33, '❤️', 6, 5, NOW() - INTERVAL '5 days'),
(34, '👏', 7, 5, NOW() - INTERVAL '5 days'),
(35, '🌱', 8, 5, NOW() - INTERVAL '4 days'),
(36, '❤️', 1, 5, NOW() - INTERVAL '4 days'),
(37, '👏', 2, 5, NOW() - INTERVAL '3 days'),

-- Insight 6: Fintech (neutral sentiment)
(38, '🤔', 1, 6, NOW() - INTERVAL '8 days'),
(39, '😐', 2, 6, NOW() - INTERVAL '8 days'),
(40, '👍', 3, 6, NOW() - INTERVAL '7 days'),
(41, '🤔', 4, 6, NOW() - INTERVAL '7 days'),
(42, '😐', 5, 6, NOW() - INTERVAL '6 days'),

-- Insight 7: Education (positive sentiment)
(43, '📚', 1, 7, NOW() - INTERVAL '9 days'),
(44, '👍', 2, 7, NOW() - INTERVAL '9 days'),
(45, '📚', 3, 7, NOW() - INTERVAL '8 days'),
(46, '👏', 4, 7, NOW() - INTERVAL '8 days'),
(47, '📚', 5, 7, NOW() - INTERVAL '7 days'),
(48, '👍', 6, 7, NOW() - INTERVAL '7 days'),

-- Insight 8: Digital Transformation (mixed sentiment)
(49, '😕', 1, 8, NOW() - INTERVAL '10 days'),
(50, '🤔', 2, 8, NOW() - INTERVAL '10 days'),
(51, '👍', 3, 8, NOW() - INTERVAL '9 days'),
(52, '😮', 4, 8, NOW() - INTERVAL '9 days'),
(53, '😕', 5, 8, NOW() - INTERVAL '8 days'),
(54, '🤔', 6, 8, NOW() - INTERVAL '8 days'),

-- Insight 9: ML Bias (concerned sentiment)
(55, '😟', 2, 9, NOW() - INTERVAL '11 days'),
(56, '🤔', 3, 9, NOW() - INTERVAL '11 days'),
(57, '😟', 4, 9, NOW() - INTERVAL '10 days'),
(58, '😮', 5, 9, NOW() - INTERVAL '10 days'),
(59, '🤔', 6, 9, NOW() - INTERVAL '9 days'),
(60, '😟', 7, 9, NOW() - INTERVAL '9 days'),

-- Insight 10: Data Privacy (concerned sentiment)
(61, '😰', 1, 10, NOW() - INTERVAL '12 days'),
(62, '😟', 3, 10, NOW() - INTERVAL '12 days'),
(63, '😰', 4, 10, NOW() - INTERVAL '11 days'),
(64, '🤔', 5, 10, NOW() - INTERVAL '11 days'),
(65, '😟', 6, 10, NOW() - INTERVAL '10 days'),
(66, '😰', 7, 10, NOW() - INTERVAL '10 days'),

-- Child insights reactions
(67, '👍', 1, 11, NOW() - INTERVAL '2 days'),
(68, '👏', 2, 11, NOW() - INTERVAL '2 days'),
(69, '❤️', 4, 11, NOW() - INTERVAL '1 day'),

(70, '🤔', 1, 12, NOW() - INTERVAL '1 day'),
(71, '👍', 3, 12, NOW() - INTERVAL '1 day'),
(72, '❤️', 5, 12, NOW() - INTERVAL '1 day'),

(73, '🌱', 1, 13, NOW() - INTERVAL '1 day'),
(74, '❤️', 2, 13, NOW() - INTERVAL '1 day'),
(75, '👏', 4, 13, NOW() - INTERVAL '1 day');

-- Insert comments with diverse emotional sentiment
INSERT INTO comments (id, comment, user_id, insight_id, created_at) VALUES
-- Insight 1: AI Ethics comments
(1, 'This is a crucial topic that needs more attention in the medical field. The ethical implications are far-reaching.', 2, 1, NOW() - INTERVAL '4 days'),
(2, 'I agree completely. We need stricter regulations before AI becomes more widespread in healthcare.', 3, 1, NOW() - INTERVAL '3 days'),
(3, 'Great insight! The balance between innovation and safety is indeed delicate.', 4, 1, NOW() - INTERVAL '2 days'),

-- Insight 2: Social Media Trends comments
(4, 'Interesting perspective on authentic content. I think users are getting tired of overly polished posts.', 1, 2, NOW() - INTERVAL '3 days'),
(5, 'But what about the mental health implications of constant comparison?', 3, 2, NOW() - INTERVAL '2 days'),
(6, 'The data shows a clear shift towards more genuine interactions.', 5, 2, NOW() - INTERVAL '1 day'),

-- Insight 3: Clean Code comments
(7, 'Couldn''t agree more! Clean code saves so much time in the long run.', 1, 3, NOW() - INTERVAL '5 days'),
(8, 'This should be mandatory reading for all developers. Great points!', 2, 3, NOW() - INTERVAL '4 days'),
(9, 'The examples you provided really illustrate the importance of maintainable code.', 4, 3, NOW() - INTERVAL '3 days'),
(10, 'I''ve seen too many codebases that ignore these principles. It''s painful to work with.', 5, 3, NOW() - INTERVAL '2 days'),

-- Insight 4: Accessibility comments
(11, 'Accessibility is often treated as an afterthought, but it should be built in from the start.', 3, 4, NOW() - INTERVAL '5 days'),
(12, 'I disagree with some of the approaches mentioned. They seem too restrictive.', 2, 4, NOW() - INTERVAL '4 days'),
(13, 'As someone with visual impairments, I appreciate this perspective. More designers need to think this way.', 1, 4, NOW() - INTERVAL '3 days'),
(14, 'The compliance vs inclusion distinction is really important here.', 5, 4, NOW() - INTERVAL '2 days'),

-- Insight 5: Climate/Renewable comments
(15, 'This gives me hope for the future! Renewable energy is the way forward.', 1, 5, NOW() - INTERVAL '6 days'),
(16, 'The timeline seems ambitious but achievable with proper investment.', 2, 5, NOW() - INTERVAL '5 days'),
(17, 'We need more initiatives like this. Climate change is urgent.', 3, 5, NOW() - INTERVAL '4 days'),
(18, 'The economic benefits are often overlooked. This could create millions of jobs.', 4, 5, NOW() - INTERVAL '3 days'),

-- Insight 6: Fintech comments
(19, 'Regulatory compliance is definitely a major challenge for fintech startups.', 1, 6, NOW() - INTERVAL '7 days'),
(20, 'The innovation vs compliance tension is real. Finding the right balance is key.', 3, 6, NOW() - INTERVAL '6 days'),
(21, 'I''ve worked in this space and can confirm these challenges are significant.', 4, 6, NOW() - INTERVAL '5 days'),

-- Insight 7: Education comments
(22, 'The curriculum needs to evolve with technology. This is a step in the right direction.', 1, 7, NOW() - INTERVAL '8 days'),
(23, 'Preparing students for AI-driven careers is essential. Great initiative by Stanford.', 2, 7, NOW() - INTERVAL '7 days'),
(24, 'I hope other universities follow suit. The traditional CS curriculum is outdated.', 3, 7, NOW() - INTERVAL '6 days'),

-- Insight 8: Digital Transformation comments
(25, 'Most companies fail because they focus on technology instead of people and processes.', 1, 8, NOW() - INTERVAL '9 days'),
(26, 'The cultural change aspect is often underestimated. Technology is the easy part.', 2, 8, NOW() - INTERVAL '8 days'),
(27, 'I''ve seen this firsthand. Companies that succeed invest heavily in change management.', 3, 8, NOW() - INTERVAL '7 days'),

-- Insight 9: ML Bias comments
(28, 'This is a critical issue that needs immediate attention. Bias in AI can have serious consequences.', 2, 9, NOW() - INTERVAL '10 days'),
(29, 'The examples of algorithmic bias are concerning. We need better oversight.', 3, 9, NOW() - INTERVAL '9 days'),
(30, 'This affects real people''s lives. The tech industry needs to take responsibility.', 4, 9, NOW() - INTERVAL '8 days'),

-- Insight 10: Data Privacy comments
(31, 'Privacy is becoming a luxury. We need stronger protections for user data.', 1, 10, NOW() - INTERVAL '11 days'),
(32, 'The current state of data privacy is alarming. Users have little control over their information.', 3, 10, NOW() - INTERVAL '10 days'),
(33, 'This is why I''m skeptical of big tech companies. They profit from our data.', 4, 10, NOW() - INTERVAL '9 days'),

-- Child insights comments
(34, 'Code reviews are essential for maintaining quality. Great practices outlined here.', 1, 11, NOW() - INTERVAL '2 days'),
(35, 'The collaborative aspect of code reviews is often overlooked. Good points!', 2, 11, NOW() - INTERVAL '1 day'),

(36, 'Accessibility in UI design is crucial. These guidelines are very helpful.', 1, 12, NOW() - INTERVAL '1 day'),
(37, 'As a designer, I appreciate the practical examples. More tools need to consider accessibility.', 3, 12, NOW() - INTERVAL '1 day'),

(38, 'Solar technology is advancing rapidly. This breakthrough could change everything.', 1, 13, NOW() - INTERVAL '1 day'),
(39, 'The efficiency improvements are impressive. Renewable energy is becoming more viable.', 2, 13, NOW() - INTERVAL '1 day');

-- Insert reactions on comments (for nested sentiment)
INSERT INTO reactions (id, reaction, user_id, comment_id, created_at) VALUES
-- Reactions on Insight 1 comments
(76, '👍', 3, 1, NOW() - INTERVAL '3 days'),
(77, '❤️', 4, 1, NOW() - INTERVAL '3 days'),
(78, '👍', 5, 2, NOW() - INTERVAL '2 days'),
(79, '👏', 6, 2, NOW() - INTERVAL '2 days'),
(80, '❤️', 1, 3, NOW() - INTERVAL '1 day'),

-- Reactions on Insight 3 comments (Clean Code - very positive)
(81, '❤️', 2, 7, NOW() - INTERVAL '4 days'),
(82, '👏', 3, 7, NOW() - INTERVAL '4 days'),
(83, '👍', 4, 7, NOW() - INTERVAL '4 days'),
(84, '❤️', 5, 8, NOW() - INTERVAL '3 days'),
(85, '👏', 6, 8, NOW() - INTERVAL '3 days'),
(86, '👍', 7, 8, NOW() - INTERVAL '3 days'),
(87, '❤️', 8, 9, NOW() - INTERVAL '2 days'),
(88, '👏', 1, 9, NOW() - INTERVAL '2 days'),
(89, '👍', 2, 10, NOW() - INTERVAL '1 day'),

-- Reactions on Insight 4 comments (Accessibility - mixed)
(90, '👍', 1, 11, NOW() - INTERVAL '4 days'),
(91, '😕', 2, 11, NOW() - INTERVAL '4 days'),
(92, '❤️', 4, 11, NOW() - INTERVAL '4 days'),
(93, '🤔', 5, 12, NOW() - INTERVAL '3 days'),
(94, '👍', 6, 12, NOW() - INTERVAL '3 days'),
(95, '❤️', 1, 13, NOW() - INTERVAL '2 days'),
(96, '👏', 3, 13, NOW() - INTERVAL '2 days'),

-- Reactions on Insight 5 comments (Climate - very positive)
(97, '🌱', 2, 15, NOW() - INTERVAL '5 days'),
(98, '❤️', 3, 15, NOW() - INTERVAL '5 days'),
(99, '👏', 4, 15, NOW() - INTERVAL '5 days'),
(100, '🌱', 5, 16, NOW() - INTERVAL '4 days'),
(101, '❤️', 6, 16, NOW() - INTERVAL '4 days'),
(102, '🌱', 7, 17, NOW() - INTERVAL '3 days'),
(103, '❤️', 8, 17, NOW() - INTERVAL '3 days'),

-- Reactions on Insight 9 comments (ML Bias - concerned)
(104, '😟', 1, 28, NOW() - INTERVAL '9 days'),
(105, '😮', 3, 28, NOW() - INTERVAL '9 days'),
(106, '😟', 4, 29, NOW() - INTERVAL '8 days'),
(107, '🤔', 5, 29, NOW() - INTERVAL '8 days'),
(108, '😮', 6, 30, NOW() - INTERVAL '7 days'),
(109, '😟', 7, 30, NOW() - INTERVAL '7 days'),

-- Reactions on Insight 10 comments (Data Privacy - concerned)
(110, '😰', 2, 31, NOW() - INTERVAL '10 days'),
(111, '😟', 4, 31, NOW() - INTERVAL '10 days'),
(112, '😰', 5, 32, NOW() - INTERVAL '9 days'),
(113, '🤔', 6, 32, NOW() - INTERVAL '9 days'),
(114, '😰', 7, 33, NOW() - INTERVAL '8 days'),
(115, '😟', 8, 33, NOW() - INTERVAL '8 days');

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('sources_id_seq', (SELECT MAX(id) FROM sources));
SELECT setval('summaries_id_seq', (SELECT MAX(id) FROM summaries));
SELECT setval('insights_id_seq', (SELECT MAX(id) FROM insights));
SELECT setval('insight_links_id_seq', (SELECT MAX(id) FROM insight_links));
SELECT setval('evidence_id_seq', (SELECT MAX(id) FROM evidence));
SELECT setval('reactions_id_seq', (SELECT MAX(id) FROM reactions));
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));
