-- Enhanced Sentiment Tokenization System Design
-- This document outlines improvements to the current emoji-based reaction system

## Current System Analysis

The current sentiment system uses:
- Simple emoji strings (❤️, 👍, 🤔, etc.) stored in `reactions.reaction`
- Basic aggregation by counting occurrences
- No semantic categorization or intensity levels
- Limited emotional range representation

## Proposed Enhanced Sentiment System

### 1. Sentiment Categories with Intensity Levels

Instead of raw emojis, implement structured sentiment tokens:

```sql
-- New sentiment_tokens table
CREATE TABLE sentiment_tokens (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'positive', 'negative', 'neutral', 'concerned', 'excited'
    intensity INTEGER NOT NULL,   -- 1-5 scale (1=low, 5=high)
    emoji VARCHAR(10) NOT NULL,   -- Visual representation
    label VARCHAR(100) NOT NULL,  -- Human-readable description
    color_hex VARCHAR(7),         -- Associated color for UI
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sentiment tokens
INSERT INTO sentiment_tokens (category, intensity, emoji, label, color_hex) VALUES
-- Positive sentiments
('positive', 1, '👍', 'Agree', '#4CAF50'),
('positive', 2, '😊', 'Pleased', '#66BB6A'),
('positive', 3, '❤️', 'Love', '#EF5350'),
('positive', 4, '👏', 'Impressed', '#FF7043'),
('positive', 5, '🎉', 'Excited', '#FF5722'),

-- Negative sentiments
('negative', 1, '😐', 'Neutral', '#9E9E9E'),
('negative', 2, '😕', 'Disagree', '#FF9800'),
('negative', 3, '😟', 'Concerned', '#FF5722'),
('negative', 4, '😰', 'Worried', '#E53935'),
('negative', 5, '😡', 'Angry', '#D32F2F'),

-- Neutral sentiments
('neutral', 1, '🤔', 'Thinking', '#607D8B'),
('neutral', 2, '😮', 'Surprised', '#795548'),
('neutral', 3, '🎯', 'Focused', '#3F51B5'),
('neutral', 4, '📚', 'Learning', '#2196F3'),
('neutral', 5, '💡', 'Insightful', '#FFC107'),

-- Specialized sentiments
('concerned', 1, '🤨', 'Skeptical', '#FF9800'),
('concerned', 2, '😬', 'Uncomfortable', '#FF5722'),
('concerned', 3, '😟', 'Concerned', '#E53935'),
('concerned', 4, '😰', 'Worried', '#D32F2F'),
('concerned', 5, '😱', 'Alarmed', '#C62828'),

('excited', 1, '😄', 'Happy', '#4CAF50'),
('excited', 2, '🤩', 'Excited', '#FF9800'),
('excited', 3, '🚀', 'Motivated', '#FF5722'),
('excited', 4, '💪', 'Empowered', '#E53935'),
('excited', 5, '🔥', 'Enthusiastic', '#D32F2F');
```

### 2. Enhanced Reactions Table

```sql
-- Modify reactions table to reference sentiment tokens
ALTER TABLE reactions ADD COLUMN sentiment_token_id INTEGER REFERENCES sentiment_tokens(id);
ALTER TABLE reactions ADD COLUMN custom_text VARCHAR(255); -- For custom reactions
ALTER TABLE reactions ADD COLUMN context VARCHAR(100); -- 'insight', 'comment', 'evidence'

-- Create index for better performance
CREATE INDEX reactions_sentiment_token_id_idx ON reactions(sentiment_token_id);
CREATE INDEX reactions_context_idx ON reactions(context);
```

### 3. Sentiment Aggregation Functions

```sql
-- Function to calculate sentiment score for an insight
CREATE OR REPLACE FUNCTION calculate_insight_sentiment(insight_id_param INTEGER)
RETURNS TABLE(
    category VARCHAR(50),
    total_count INTEGER,
    weighted_score NUMERIC,
    dominant_sentiment VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    WITH sentiment_weights AS (
        SELECT 
            st.category,
            st.intensity,
            COUNT(r.id) as reaction_count,
            COUNT(r.id) * st.intensity as weighted_reactions
        FROM reactions r
        JOIN sentiment_tokens st ON r.sentiment_token_id = st.id
        WHERE r.insight_id = insight_id_param
        GROUP BY st.category, st.intensity
    ),
    category_totals AS (
        SELECT 
            category,
            SUM(reaction_count) as total_count,
            SUM(weighted_reactions) as weighted_score
        FROM sentiment_weights
        GROUP BY category
    )
    SELECT 
        ct.category,
        ct.total_count::INTEGER,
        ct.weighted_score,
        (SELECT category FROM category_totals ORDER BY weighted_score DESC LIMIT 1) as dominant_sentiment
    FROM category_totals ct
    ORDER BY ct.weighted_score DESC;
END;
$$ LANGUAGE plpgsql;
```

### 4. UI Display Components

#### Sentiment Visualization Component
```typescript
interface SentimentDisplayProps {
  insightId: number;
  showDetails?: boolean;
  compact?: boolean;
}

interface SentimentData {
  category: string;
  totalCount: number;
  weightedScore: number;
  dominantSentiment: string;
  breakdown: {
    intensity: number;
    count: number;
    emoji: string;
    color: string;
  }[];
}

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({
  insightId,
  showDetails = false,
  compact = false
}) => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  
  // Fetch sentiment data using the new aggregation function
  useEffect(() => {
    fetchSentimentData(insightId).then(setSentimentData);
  }, [insightId]);

  if (compact) {
    return (
      <div className="sentiment-compact">
        {sentimentData.slice(0, 3).map(sentiment => (
          <span 
            key={sentiment.category}
            className="sentiment-badge"
            style={{ backgroundColor: getCategoryColor(sentiment.category) }}
            title={`${sentiment.totalCount} ${sentiment.category} reactions`}
          >
            {getCategoryEmoji(sentiment.category)} {sentiment.totalCount}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="sentiment-detailed">
      <div className="sentiment-summary">
        <h4>Overall Sentiment: {sentimentData[0]?.dominantSentiment}</h4>
        <div className="sentiment-meter">
          {sentimentData.map(sentiment => (
            <div 
              key={sentiment.category}
              className="sentiment-bar"
              style={{ 
                width: `${(sentiment.weightedScore / getTotalScore()) * 100}%`,
                backgroundColor: getCategoryColor(sentiment.category)
              }}
            />
          ))}
        </div>
      </div>
      
      {showDetails && (
        <div className="sentiment-breakdown">
          {sentimentData.map(sentiment => (
            <div key={sentiment.category} className="sentiment-category">
              <h5>{sentiment.category} ({sentiment.totalCount})</h5>
              <div className="intensity-breakdown">
                {sentiment.breakdown.map(item => (
                  <span 
                    key={item.intensity}
                    className="intensity-item"
                    style={{ color: item.color }}
                  >
                    {item.emoji} {item.count}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### Enhanced Reaction Picker
```typescript
const EnhancedReactionPicker: React.FC<ReactionPickerProps> = ({
  onReactionSelect,
  currentReactions = []
}) => {
  const [sentimentTokens, setSentimentTokens] = useState<SentimentToken[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('positive');

  const categories = ['positive', 'negative', 'neutral', 'concerned', 'excited'];
  
  const filteredTokens = sentimentTokens.filter(
    token => token.category === selectedCategory
  );

  return (
    <div className="enhanced-reaction-picker">
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
            style={{ backgroundColor: getCategoryColor(category) }}
          >
            {getCategoryEmoji(category)} {category}
          </button>
        ))}
      </div>
      
      <div className="intensity-grid">
        {filteredTokens.map(token => (
          <button
            key={token.id}
            className="sentiment-token-button"
            onClick={() => onReactionSelect(token.id)}
            style={{ 
              backgroundColor: token.color_hex,
              opacity: currentReactions.includes(token.id) ? 1 : 0.7
            }}
            title={token.label}
          >
            <span className="token-emoji">{token.emoji}</span>
            <span className="token-intensity">{token.intensity}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 5. CSS Styling for Enhanced Sentiment Display

```css
/* Enhanced Sentiment Display Styles */
.sentiment-compact {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.sentiment-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.sentiment-badge:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.sentiment-detailed {
  background: var(--color-background-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  margin: var(--spacing-2) 0;
}

.sentiment-summary h4 {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.sentiment-meter {
  display: flex;
  height: 8px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-background-tertiary);
}

.sentiment-bar {
  height: 100%;
  transition: width var(--transition-base);
}

.sentiment-breakdown {
  margin-top: var(--spacing-3);
}

.sentiment-category {
  margin-bottom: var(--spacing-2);
}

.sentiment-category h5 {
  margin: 0 0 var(--spacing-1) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-transform: capitalize;
}

.intensity-breakdown {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.intensity-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1);
  border-radius: var(--radius-sm);
  background: var(--color-background-tertiary);
  font-size: var(--font-size-xs);
}

/* Enhanced Reaction Picker */
.enhanced-reaction-picker {
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-xl);
  min-width: 300px;
}

.category-tabs {
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-border-primary);
  padding-bottom: var(--spacing-2);
}

.category-tab {
  flex: 1;
  padding: var(--spacing-2);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
}

.category-tab.active {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
}

.intensity-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-2);
}

.sentiment-token-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-background-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 60px;
}

.sentiment-token-button:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.sentiment-token-button:active {
  transform: scale(0.95);
}

.token-emoji {
  font-size: var(--font-size-lg);
}

.token-intensity {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}
```

### 6. Migration Strategy

```sql
-- Step 1: Create new tables
-- (Run the CREATE TABLE statements above)

-- Step 2: Migrate existing reactions
INSERT INTO reactions (reaction, user_id, insight_id, summary_id, comment_id, created_at, sentiment_token_id, context)
SELECT 
    r.reaction,
    r.user_id,
    r.insight_id,
    r.summary_id,
    r.comment_id,
    r.created_at,
    st.id as sentiment_token_id,
    CASE 
        WHEN r.insight_id IS NOT NULL THEN 'insight'
        WHEN r.comment_id IS NOT NULL THEN 'comment'
        WHEN r.summary_id IS NOT NULL THEN 'evidence'
        ELSE 'unknown'
    END as context
FROM reactions r
LEFT JOIN sentiment_tokens st ON st.emoji = r.reaction
WHERE st.id IS NOT NULL;

-- Step 3: Add fallback for unmapped reactions
INSERT INTO sentiment_tokens (category, intensity, emoji, label, color_hex)
SELECT DISTINCT 
    'neutral' as category,
    1 as intensity,
    r.reaction as emoji,
    'Custom Reaction' as label,
    '#9E9E9E' as color_hex
FROM reactions r
LEFT JOIN sentiment_tokens st ON st.emoji = r.reaction
WHERE st.id IS NULL AND r.reaction IS NOT NULL;

-- Step 4: Update remaining reactions
UPDATE reactions 
SET sentiment_token_id = st.id
FROM sentiment_tokens st
WHERE reactions.sentiment_token_id IS NULL 
  AND reactions.reaction = st.emoji;
```

## Benefits of Enhanced System

1. **Structured Sentiment Analysis**: Categorized emotions with intensity levels
2. **Better UI/UX**: Color-coded, organized reaction picker
3. **Analytics Capabilities**: Sentiment trends, dominant emotions per insight
4. **Scalability**: Easy to add new sentiment categories
5. **Accessibility**: Better screen reader support with labels
6. **Data Insights**: Weighted sentiment scores for better analysis

## Implementation Priority

1. **Phase 1**: Create sentiment_tokens table and basic migration
2. **Phase 2**: Update reaction picker UI components
3. **Phase 3**: Implement sentiment aggregation functions
4. **Phase 4**: Add advanced sentiment visualization components
5. **Phase 5**: Analytics dashboard for sentiment trends
