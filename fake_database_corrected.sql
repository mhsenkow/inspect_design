-- Corrected Fake Database for Inspect Design Testing
-- This version works with the existing database schema

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM reactions;
-- DELETE FROM comments;
-- DELETE FROM evidence;
-- DELETE FROM insight_links;
-- DELETE FROM summaries;
-- DELETE FROM insights;
-- DELETE FROM sources;
-- DELETE FROM users;

-- Insert test users (using higher IDs to avoid conflicts)
INSERT INTO users (id, username, email, password, avatar_uri, profile, verified) VALUES
(100, 'alex_researcher', 'alex@example.com', 'hashed_password_1', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'AI researcher focused on machine learning ethics', true),
(101, 'sarah_analyst', 'sarah@example.com', 'hashed_password_2', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'Data analyst specializing in social media trends', true),
(102, 'mike_developer', 'mike@example.com', 'hashed_password_3', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'Full-stack developer passionate about clean code', true),
(103, 'emma_designer', 'emma@example.com', 'hashed_password_4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', 'UX designer with expertise in accessibility', true),
(104, 'david_scientist', 'david@example.com', 'hashed_password_5', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 'Climate scientist studying renewable energy', true),
(105, 'lisa_entrepreneur', 'lisa@example.com', 'hashed_password_6', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa', 'Startup founder in the fintech space', true),
(106, 'james_educator', 'james@example.com', 'hashed_password_7', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 'Computer science professor and researcher', true),
(107, 'maria_consultant', 'maria@example.com', 'hashed_password_8', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', 'Management consultant specializing in digital transformation', true);

-- Insert test sources (using higher IDs to avoid conflicts)
INSERT INTO sources (id, baseurl, logo_uri) VALUES
(100, 'nature.com', 'https://www.nature.com/favicon.ico'),
(101, 'arxiv.org', 'https://arxiv.org/favicon.ico'),
(102, 'github.com', 'https://github.com/favicon.ico'),
(103, 'stackoverflow.com', 'https://stackoverflow.com/favicon.ico'),
(104, 'techcrunch.com', 'https://techcrunch.com/favicon.ico'),
(105, 'wired.com', 'https://www.wired.com/favicon.ico'),
(106, 'mit.edu', 'https://web.mit.edu/favicon.ico'),
(107, 'stanford.edu', 'https://www.stanford.edu/favicon.ico'),
(108, 'medium.com', 'https://medium.com/favicon.ico'),
(109, 'ycombinator.com', 'https://www.ycombinator.com/favicon.ico');

-- Insert test summaries (evidence sources)
INSERT INTO summaries (id, url, title, source_id, uid, original_title, created_at, updated_at) VALUES
-- AI/ML Research Papers
(100, 'https://nature.com/articles/ai-ethics-2024', 'Ethical Implications of Large Language Models in Healthcare', 100, 'nature-ai-ethics-2024', 'Ethical Implications of Large Language Models in Healthcare', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
(101, 'https://arxiv.org/abs/2401.12345', 'Transformer Architecture Improvements for Multimodal Learning', 101, 'arxiv-transformer-multimodal-2024', 'Transformer Architecture Improvements for Multimodal Learning', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
(102, 'https://github.com/microsoft/vscode', 'Visual Studio Code: Open Source Code Editor', 102, 'github-vscode', 'Visual Studio Code: Open Source Code Editor', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
(103, 'https://stackoverflow.com/questions/ai-best-practices', 'Best Practices for AI Model Deployment in Production', 103, 'stackoverflow-ai-deployment', 'Best Practices for AI Model Deployment in Production', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

-- Climate Science
(104, 'https://nature.com/articles/climate-renewable-2024', 'Renewable Energy Breakthrough: Solar Panel Efficiency Reaches 50%', 100, 'nature-solar-efficiency-2024', 'Renewable Energy Breakthrough: Solar Panel Efficiency Reaches 50%', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days'),
(105, 'https://mit.edu/news/climate-carbon-capture', 'MIT Researchers Develop Novel Carbon Capture Technology', 106, 'mit-carbon-capture-2024', 'MIT Researchers Develop Novel Carbon Capture Technology', NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 days'),

-- Technology Trends
(106, 'https://techcrunch.com/quantum-computing-2024', 'Quantum Computing Milestone: IBM Achieves Quantum Advantage', 104, 'techcrunch-quantum-ibm-2024', 'Quantum Computing Milestone: IBM Achieves Quantum Advantage', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
(107, 'https://wired.com/cybersecurity-threats-2024', 'Cybersecurity Threats Reach All-Time High in 2024', 105, 'wired-cybersecurity-2024', 'Cybersecurity Threats Reach All-Time High in 2024', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

-- Startup/Entrepreneurship
(108, 'https://ycombinator.com/blog/startup-funding-2024', 'Y Combinator Announces Record-Breaking Funding Round', 109, 'ycombinator-funding-2024', 'Y Combinator Announces Record-Breaking Funding Round', NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days'),
(109, 'https://medium.com/@founder/startup-lessons', '10 Lessons Learned from Building a Successful SaaS Startup', 108, 'medium-saas-lessons', '10 Lessons Learned from Building a Successful SaaS Startup', NOW() - INTERVAL '11 days', NOW() - INTERVAL '5 days'),

-- Education/Research
(110, 'https://stanford.edu/news/computer-science-education', 'Stanford Launches New Computer Science Curriculum for AI Era', 107, 'stanford-cs-curriculum-2024', 'Stanford Launches New Computer Science Curriculum for AI Era', NOW() - INTERVAL '12 days', NOW() - INTERVAL '6 days'),
(111, 'https://github.com/tensorflow/tensorflow', 'TensorFlow 2.15 Release Notes and New Features', 102, 'github-tensorflow-2-15', 'TensorFlow 2.15 Release Notes and New Features', NOW() - INTERVAL '13 days', NOW() - INTERVAL '7 days');

-- Insert test insights with diverse emotional sentiment patterns
INSERT INTO insights (id, user_id, uid, title, is_public, created_at, updated_at) VALUES
-- High-engagement insights with positive sentiment
(100, 100, 'insight-ai-ethics-healthcare', 'AI Ethics in Healthcare: Balancing Innovation with Patient Safety', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
(101, 101, 'insight-social-media-trends', 'Social Media Trends: The Rise of Authentic Content in 2024', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
(102, 102, 'insight-clean-code-practices', 'Clean Code Practices: Why They Matter More Than Ever', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'),

-- Controversial insights with mixed sentiment
(103, 103, 'insight-accessibility-design', 'Accessibility in Design: Beyond Compliance to True Inclusion', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days'),
(104, 104, 'insight-climate-renewable', 'Renewable Energy: The Path to Carbon Neutrality by 2030', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days'),

-- Technical insights with neutral sentiment
(105, 105, 'insight-fintech-startup', 'Fintech Startup Challenges: Regulatory Compliance vs Innovation', true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '6 days'),
(106, 106, 'insight-computer-science-education', 'Computer Science Education: Preparing Students for AI-Driven Future', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'),

-- Personal/opinion insights with emotional sentiment
(107, 107, 'insight-digital-transformation', 'Digital Transformation: Why Most Companies Fail and How to Succeed', true, NOW() - INTERVAL '11 days', NOW() - INTERVAL '8 days'),
(108, 100, 'insight-machine-learning-bias', 'Machine Learning Bias: The Hidden Dangers in Algorithmic Decision Making', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days'),
(109, 101, 'insight-data-privacy', 'Data Privacy in the Age of Big Data: A User Perspective', true, NOW() - INTERVAL '13 days', NOW() - INTERVAL '10 days'),

-- Child insights (for hierarchical relationships)
(110, 102, 'insight-code-review-process', 'Code Review Process: Best Practices for Team Collaboration', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(111, 103, 'insight-ui-accessibility', 'UI Accessibility: Designing for Users with Visual Impairments', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(112, 104, 'insight-solar-technology', 'Solar Technology Breakthrough: Implications for Global Energy', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert insight links (parent-child relationships)
INSERT INTO insight_links (id, parent_id, child_id) VALUES
-- Main insights with children
(100, 102, 110), -- Clean Code Practices -> Code Review Process
(101, 103, 111), -- Accessibility in Design -> UI Accessibility
(102, 104, 112), -- Renewable Energy -> Solar Technology

-- Cross-domain relationships
(103, 100, 108),  -- AI Ethics -> Machine Learning Bias
(104, 101, 109), -- Social Media Trends -> Data Privacy
(105, 105, 107);  -- Fintech Startup -> Digital Transformation

-- Insert evidence (insight-summary relationships)
INSERT INTO evidence (id, insight_id, summary_id) VALUES
-- AI Ethics insight evidence
(100, 100, 100), -- AI Ethics -> Nature AI Ethics paper
(101, 100, 101), -- AI Ethics -> ArXiv Transformer paper
(102, 100, 103), -- AI Ethics -> StackOverflow AI practices

-- Social Media Trends insight evidence
(103, 101, 106), -- Social Media -> TechCrunch Quantum article
(104, 101, 107), -- Social Media -> Wired Cybersecurity article

-- Clean Code insight evidence
(105, 102, 102), -- Clean Code -> GitHub VSCode
(106, 102, 103), -- Clean Code -> StackOverflow AI practices

-- Accessibility insight evidence
(107, 103, 110), -- Accessibility -> Stanford CS curriculum
(108, 103, 111), -- Accessibility -> TensorFlow release

-- Climate/Renewable insight evidence
(109, 104, 104), -- Climate -> Nature Solar efficiency
(110, 104, 105), -- Climate -> MIT Carbon capture

-- Fintech insight evidence
(111, 105, 108), -- Fintech -> Y Combinator funding
(112, 105, 109), -- Fintech -> Medium SaaS lessons

-- Education insight evidence
(113, 106, 110), -- Education -> Stanford CS curriculum
(114, 106, 111), -- Education -> TensorFlow release

-- Digital Transformation insight evidence
(115, 107, 108), -- Digital -> Y Combinator funding
(116, 107, 109), -- Digital -> Medium SaaS lessons

-- Machine Learning Bias insight evidence
(117, 108, 100), -- ML Bias -> Nature AI ethics
(118, 108, 101), -- ML Bias -> ArXiv Transformer

-- Data Privacy insight evidence
(119, 109, 106), -- Privacy -> TechCrunch Quantum
(120, 109, 107), -- Privacy -> Wired Cybersecurity

-- Child insights evidence
(121, 110, 102), -- Code Review -> GitHub VSCode
(122, 111, 110), -- UI Accessibility -> Stanford CS
(123, 112, 104); -- Solar Tech -> Nature Solar

-- Insert reactions with diverse emotional sentiment patterns
INSERT INTO reactions (id, reaction, user_id, insight_id, created_at) VALUES
-- Insight 100: AI Ethics (mostly positive sentiment)
(100, '🤔', 101, 100, NOW() - INTERVAL '4 days'),
(101, '👍', 102, 100, NOW() - INTERVAL '4 days'),
(102, '❤️', 103, 100, NOW() - INTERVAL '3 days'),
(103, '🎯', 104, 100, NOW() - INTERVAL '3 days'),
(104, '👏', 105, 100, NOW() - INTERVAL '2 days'),
(105, '🤔', 106, 100, NOW() - INTERVAL '2 days'),
(106, '👍', 107, 100, NOW() - INTERVAL '1 day'),

-- Insight 101: Social Media Trends (mixed sentiment)
(107, '😊', 100, 101, NOW() - INTERVAL '3 days'),
(108, '🤔', 102, 101, NOW() - INTERVAL '3 days'),
(109, '😮', 103, 101, NOW() - INTERVAL '2 days'),
(110, '👍', 104, 101, NOW() - INTERVAL '2 days'),
(111, '😕', 105, 101, NOW() - INTERVAL '1 day'),

-- Insight 102: Clean Code (very positive sentiment)
(112, '❤️', 100, 102, NOW() - INTERVAL '5 days'),
(113, '👏', 101, 102, NOW() - INTERVAL '5 days'),
(114, '🎯', 103, 102, NOW() - INTERVAL '4 days'),
(115, '👍', 104, 102, NOW() - INTERVAL '4 days'),
(116, '❤️', 105, 102, NOW() - INTERVAL '3 days'),
(117, '👏', 106, 102, NOW() - INTERVAL '3 days'),
(118, '🎯', 107, 102, NOW() - INTERVAL '2 days'),
(119, '👍', 100, 102, NOW() - INTERVAL '2 days'),
(120, '❤️', 101, 102, NOW() - INTERVAL '1 day'),

-- Insight 103: Accessibility (controversial - mixed sentiment)
(121, '🤔', 100, 103, NOW() - INTERVAL '6 days'),
(122, '😕', 101, 103, NOW() - INTERVAL '6 days'),
(123, '❤️', 102, 103, NOW() - INTERVAL '5 days'),
(124, '👍', 104, 103, NOW() - INTERVAL '5 days'),
(125, '😮', 105, 103, NOW() - INTERVAL '4 days'),
(126, '🤔', 106, 103, NOW() - INTERVAL '4 days'),
(127, '😊', 107, 103, NOW() - INTERVAL '3 days'),

-- Insight 104: Climate/Renewable (very positive sentiment)
(128, '🌱', 100, 104, NOW() - INTERVAL '7 days'),
(129, '❤️', 101, 104, NOW() - INTERVAL '7 days'),
(130, '👏', 102, 104, NOW() - INTERVAL '6 days'),
(131, '🌱', 103, 104, NOW() - INTERVAL '6 days'),
(132, '❤️', 105, 104, NOW() - INTERVAL '5 days'),
(133, '👏', 106, 104, NOW() - INTERVAL '5 days'),
(134, '🌱', 107, 104, NOW() - INTERVAL '4 days'),
(135, '❤️', 100, 104, NOW() - INTERVAL '4 days'),
(136, '👏', 101, 104, NOW() - INTERVAL '3 days'),

-- Insight 105: Fintech (neutral sentiment)
(137, '🤔', 100, 105, NOW() - INTERVAL '8 days'),
(138, '😐', 101, 105, NOW() - INTERVAL '8 days'),
(139, '👍', 102, 105, NOW() - INTERVAL '7 days'),
(140, '🤔', 103, 105, NOW() - INTERVAL '7 days'),
(141, '😐', 104, 105, NOW() - INTERVAL '6 days'),

-- Insight 106: Education (positive sentiment)
(142, '📚', 100, 106, NOW() - INTERVAL '9 days'),
(143, '👍', 101, 106, NOW() - INTERVAL '9 days'),
(144, '📚', 102, 106, NOW() - INTERVAL '8 days'),
(145, '👏', 103, 106, NOW() - INTERVAL '8 days'),
(146, '📚', 104, 106, NOW() - INTERVAL '7 days'),
(147, '👍', 105, 106, NOW() - INTERVAL '7 days'),

-- Insight 107: Digital Transformation (mixed sentiment)
(148, '😕', 100, 107, NOW() - INTERVAL '10 days'),
(149, '🤔', 101, 107, NOW() - INTERVAL '10 days'),
(150, '👍', 102, 107, NOW() - INTERVAL '9 days'),
(151, '😮', 103, 107, NOW() - INTERVAL '9 days'),
(152, '😕', 104, 107, NOW() - INTERVAL '8 days'),
(153, '🤔', 105, 107, NOW() - INTERVAL '8 days'),

-- Insight 108: ML Bias (concerned sentiment)
(154, '😟', 101, 108, NOW() - INTERVAL '11 days'),
(155, '🤔', 102, 108, NOW() - INTERVAL '11 days'),
(156, '😟', 103, 108, NOW() - INTERVAL '10 days'),
(157, '😮', 104, 108, NOW() - INTERVAL '10 days'),
(158, '🤔', 105, 108, NOW() - INTERVAL '9 days'),
(159, '😟', 106, 108, NOW() - INTERVAL '9 days'),

-- Insight 109: Data Privacy (concerned sentiment)
(160, '😰', 100, 109, NOW() - INTERVAL '12 days'),
(161, '😟', 102, 109, NOW() - INTERVAL '12 days'),
(162, '😰', 103, 109, NOW() - INTERVAL '11 days'),
(163, '🤔', 104, 109, NOW() - INTERVAL '11 days'),
(164, '😟', 105, 109, NOW() - INTERVAL '10 days'),
(165, '😰', 106, 109, NOW() - INTERVAL '10 days'),

-- Child insights reactions
(166, '👍', 100, 110, NOW() - INTERVAL '2 days'),
(167, '👏', 101, 110, NOW() - INTERVAL '2 days'),
(168, '❤️', 103, 110, NOW() - INTERVAL '1 day'),

(169, '🤔', 100, 111, NOW() - INTERVAL '1 day'),
(170, '👍', 102, 111, NOW() - INTERVAL '1 day'),
(171, '❤️', 104, 111, NOW() - INTERVAL '1 day'),

(172, '🌱', 100, 112, NOW() - INTERVAL '1 day'),
(173, '❤️', 101, 112, NOW() - INTERVAL '1 day'),
(174, '👏', 103, 112, NOW() - INTERVAL '1 day');

-- Insert comments with diverse emotional sentiment
INSERT INTO comments (id, comment, user_id, insight_id, created_at) VALUES
-- Insight 100: AI Ethics comments
(100, 'This is a crucial topic that needs more attention in the medical field. The ethical implications are far-reaching.', 101, 100, NOW() - INTERVAL '4 days'),
(101, 'I agree completely. We need stricter regulations before AI becomes more widespread in healthcare.', 102, 100, NOW() - INTERVAL '3 days'),
(102, 'Great insight! The balance between innovation and safety is indeed delicate.', 103, 100, NOW() - INTERVAL '2 days'),

-- Insight 101: Social Media Trends comments
(103, 'Interesting perspective on authentic content. I think users are getting tired of overly polished posts.', 100, 101, NOW() - INTERVAL '3 days'),
(104, 'But what about the mental health implications of constant comparison?', 102, 101, NOW() - INTERVAL '2 days'),
(105, 'The data shows a clear shift towards more genuine interactions.', 104, 101, NOW() - INTERVAL '1 day'),

-- Insight 102: Clean Code comments
(106, 'Couldn''t agree more! Clean code saves so much time in the long run.', 100, 102, NOW() - INTERVAL '5 days'),
(107, 'This should be mandatory reading for all developers. Great points!', 101, 102, NOW() - INTERVAL '4 days'),
(108, 'The examples you provided really illustrate the importance of maintainable code.', 103, 102, NOW() - INTERVAL '3 days'),
(109, 'I''ve seen too many codebases that ignore these principles. It''s painful to work with.', 104, 102, NOW() - INTERVAL '2 days'),

-- Insight 103: Accessibility comments
(110, 'Accessibility is often treated as an afterthought, but it should be built in from the start.', 102, 103, NOW() - INTERVAL '5 days'),
(111, 'I disagree with some of the approaches mentioned. They seem too restrictive.', 101, 103, NOW() - INTERVAL '4 days'),
(112, 'As someone with visual impairments, I appreciate this perspective. More designers need to think this way.', 100, 103, NOW() - INTERVAL '3 days'),
(113, 'The compliance vs inclusion distinction is really important here.', 104, 103, NOW() - INTERVAL '2 days'),

-- Insight 104: Climate/Renewable comments
(114, 'This gives me hope for the future! Renewable energy is the way forward.', 100, 104, NOW() - INTERVAL '6 days'),
(115, 'The timeline seems ambitious but achievable with proper investment.', 101, 104, NOW() - INTERVAL '5 days'),
(116, 'We need more initiatives like this. Climate change is urgent.', 102, 104, NOW() - INTERVAL '4 days'),
(117, 'The economic benefits are often overlooked. This could create millions of jobs.', 103, 104, NOW() - INTERVAL '3 days'),

-- Insight 105: Fintech comments
(118, 'Regulatory compliance is definitely a major challenge for fintech startups.', 100, 105, NOW() - INTERVAL '7 days'),
(119, 'The innovation vs compliance tension is real. Finding the right balance is key.', 102, 105, NOW() - INTERVAL '6 days'),
(120, 'I''ve worked in this space and can confirm these challenges are significant.', 103, 105, NOW() - INTERVAL '5 days'),

-- Insight 106: Education comments
(121, 'The curriculum needs to evolve with technology. This is a step in the right direction.', 100, 106, NOW() - INTERVAL '8 days'),
(122, 'Preparing students for AI-driven careers is essential. Great initiative by Stanford.', 101, 106, NOW() - INTERVAL '7 days'),
(123, 'I hope other universities follow suit. The traditional CS curriculum is outdated.', 102, 106, NOW() - INTERVAL '6 days'),

-- Insight 107: Digital Transformation comments
(124, 'Most companies fail because they focus on technology instead of people and processes.', 100, 107, NOW() - INTERVAL '9 days'),
(125, 'The cultural change aspect is often underestimated. Technology is the easy part.', 101, 107, NOW() - INTERVAL '8 days'),
(126, 'I''ve seen this firsthand. Companies that succeed invest heavily in change management.', 102, 107, NOW() - INTERVAL '7 days'),

-- Insight 108: ML Bias comments
(127, 'This is a critical issue that needs immediate attention. Bias in AI can have serious consequences.', 101, 108, NOW() - INTERVAL '10 days'),
(128, 'The examples of algorithmic bias are concerning. We need better oversight.', 102, 108, NOW() - INTERVAL '9 days'),
(129, 'This affects real people''s lives. The tech industry needs to take responsibility.', 103, 108, NOW() - INTERVAL '8 days'),

-- Insight 109: Data Privacy comments
(130, 'Privacy is becoming a luxury. We need stronger protections for user data.', 100, 109, NOW() - INTERVAL '11 days'),
(131, 'The current state of data privacy is alarming. Users have little control over their information.', 102, 109, NOW() - INTERVAL '10 days'),
(132, 'This is why I''m skeptical of big tech companies. They profit from our data.', 103, 109, NOW() - INTERVAL '9 days'),

-- Child insights comments
(133, 'Code reviews are essential for maintaining quality. Great practices outlined here.', 100, 110, NOW() - INTERVAL '2 days'),
(134, 'The collaborative aspect of code reviews is often overlooked. Good points!', 101, 110, NOW() - INTERVAL '1 day'),

(135, 'Accessibility in UI design is crucial. These guidelines are very helpful.', 100, 111, NOW() - INTERVAL '1 day'),
(136, 'As a designer, I appreciate the practical examples. More tools need to consider accessibility.', 102, 111, NOW() - INTERVAL '1 day'),

(137, 'Solar technology is advancing rapidly. This breakthrough could change everything.', 100, 112, NOW() - INTERVAL '1 day'),
(138, 'The efficiency improvements are impressive. Renewable energy is becoming more viable.', 101, 112, NOW() - INTERVAL '1 day');

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq1', (SELECT MAX(id) FROM users));
SELECT setval('sources_id_seq1', (SELECT MAX(id) FROM sources));
SELECT setval('summaries_id_seq1', (SELECT MAX(id) FROM summaries));
SELECT setval('insights_id_seq1', (SELECT MAX(id) FROM insights));
SELECT setval('insight_links_id_seq1', (SELECT MAX(id) FROM insight_links));
SELECT setval('evidence_id_seq1', (SELECT MAX(id) FROM evidence));
SELECT setval('reactions_id_seq1', (SELECT MAX(id) FROM reactions));
SELECT setval('comments_id_seq1', (SELECT MAX(id) FROM comments));
