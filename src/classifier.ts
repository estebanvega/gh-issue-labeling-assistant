import OpenAI from 'openai';
import { encode } from '@toon-format/toon';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyIssue(issues: any[]): Promise<string> {
  const encodedData = encode(issues);
  console.info('Encoded data size:', encodedData.length);

  const response = await client.responses.create({
    prompt: {
      id: process.env.PROMPT_TEMPLATE_ID || 'default-prompt',
      version: '1',
      variables: {
        similar_issues: encodedData,
        title: 'Tooltip: Renders behind dialog',
        body:
          '### Bug already reported?\n' +
          '\n' +
          '- [x] I confirm that I have checked if the bug already has been reported\n' +
          '\n' +
          '### For which framework/library you are reporting the bug\n' +
          '\n' +
          'Angular\n' +
          '\n' +
          '### Component name\n' +
          '\n' +
          'Tooltip\n' +
          '\n' +
          '### Description\n' +
          '\n' +
          'Currently if you want to use tooltips in a green dialog (slide-out variant) tooltip is added to the DOM, but its hidden under the dialog. and is not visible\n' +
          '\n' +
          '### Steps To Reproduce\n' +
          '\n' +
          '1. Login into nibp\n' +
          '2. Navigate "Pay and transfer" -> "My recipients"\n' +
          '3. Click on any existing recipient that has either long recipient name or bank name (is truncated)\n' +
          '4. Once dialog opens, hover over truncated text\n' +
          '\n' +
          'Notice that tooltip is not being visible, but in DOM new element is attached to body and removed once mouse is not hovering truncated text\n' +
          '\n' +
          '### Current Behaviour\n' +
          '\n' +
          'Tooltip element is added to DOM but is hidden behind the dialog\n' +
          '\n' +
          '### Expected Behaviour\n' +
          '\n' +
          'Tooltip element is added to DOM and is visible in dialog',
      },
    },
  });

  return response.output_text;
}
