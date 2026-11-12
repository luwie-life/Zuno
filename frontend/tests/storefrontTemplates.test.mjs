import test from 'node:test';
import assert from 'node:assert/strict';
import { STOREFRONT_TEMPLATES, getStorefrontTemplates, applyStorefrontTemplate } from '../src/lib/storefrontTemplates.js';
import { normalizeStorefrontConfig, isSectionAllowedForBusiness, parseColorInput, getContrastRatio, updateElement, normalizeSection } from '../src/lib/storefront.js';
import { normalizeStorefrontConfig as backendNormalize } from '../../backend/src/lib/storefront.js';

const required = ['fashion-minimal','fashion-luxury','fashion-streetwear','beauty-studio','skincare','restaurant','bakery','professional-services','freelancer','salon-barber','spa-wellness','creative-portfolio','fitness-coach','property-services','home-services','modern-business'];
test('template inventory includes exactly the sixteen required unique IDs', () => {
  const ids = STOREFRONT_TEMPLATES.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), [...required].sort());
});
for (const businessType of ['product','service','both']) {
  for (const template of getStorefrontTemplates({ businessType })) {
    test(`${template.id}: ${businessType} application and normalization retain template, theme and extra pages`, () => {
      const current = { identity: { displayName: 'Acme' }, pages: [{ id: 'home', slug: 'home', isHome: true, sections: [] }, { id: 'extra', title: 'About us', slug: 'about-us', visible: true, sections: [] }] };
      const original = JSON.stringify(current);
      const applied = applyStorefrontTemplate(current, template.id, { businessType, businessName: 'Acme', preserveExtraPages: true });
      assert.equal(applied.templateId, template.id);
      assert.ok(applied.pages.some(page => page.slug === 'about-us'));
      for (const section of applied.pages.find(page => page.isHome).sections) assert.equal(isSectionAllowedForBusiness(section.type, businessType), true);
      const saved = backendNormalize(JSON.parse(JSON.stringify(applied)), 'Acme');
      const reopened = normalizeStorefrontConfig(saved, 'Acme');
      assert.equal(reopened.templateId, template.id);
      assert.deepEqual(reopened.theme, applied.theme);
      assert.deepEqual(reopened.pages, applied.pages);
      assert.equal(reopened.identity.displayName, 'Acme');
      assert.equal(JSON.stringify(current), original);
    });
  }
}
test('invalid IDs are discarded without changing other configuration', () => {
  const result = normalizeStorefrontConfig({ templateId: '<script>', identity: { displayName: 'Acme' } });
  assert.equal(result.templateId, '');
  assert.equal(result.identity.displayName, 'Acme');
});
test('existing color and mutation utility contracts remain available', () => {
  assert.equal(parseColorInput('rgb(255, 0, 0)'), '#FF0000');
  assert.equal(parseColorInput('hsl(0, 100%, 50%)'), '#FF0000');
  assert.equal(getContrastRatio('#FFFFFF', '#000000'), 21);
  const section = normalizeSection({ id: 'hero', type: 'hero', elements: [{ id: 'title', type: 'heading', content: 'Hello', style: { x: 123.5, y: 240, positioned: true } }] });
  const next = updateElement(section, 'title', { id: 'replacement', content: 'Updated' });
  assert.equal(next.elements[0].id, 'title');
  assert.equal(next.elements[0].style.x, 123.5);
  assert.equal(next.elements[0].style.y, 240);
});
