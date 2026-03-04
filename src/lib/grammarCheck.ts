export interface GrammarIssue {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: {
    id: string;
    category: {
      id: string;
      name: string;
    };
  };
  type: 'grammar' | 'style' | 'spelling' | 'passive' | 'weak-verb';
}

export async function checkGrammar(text: string): Promise<GrammarIssue[]> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        language: 'en-US',
        enabledOnly: 'false',
        level: 'picky',
      }),
    });

    if (!response.ok) {
      throw new Error('Grammar check failed');
    }

    const data = await response.json();

    return data.matches.map((match: any) => {
      let type: GrammarIssue['type'] = 'grammar';

      if (match.rule.issueType === 'misspelling') {
        type = 'spelling';
      } else if (match.rule.category.id === 'STYLE') {
        type = 'style';
      } else if (match.rule.id.includes('PASSIVE_VOICE')) {
        type = 'passive';
      } else if (match.rule.id.includes('WEAK_VERB')) {
        type = 'weak-verb';
      }

      return {
        message: match.message,
        shortMessage: match.shortMessage || match.message,
        offset: match.offset,
        length: match.length,
        replacements: match.replacements.map((r: any) => r.value).slice(0, 3),
        rule: match.rule,
        type,
      };
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    return [];
  }
}
