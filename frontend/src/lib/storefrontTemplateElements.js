import { createElement } from './storefront.js';

const makeHeading = (content, style = {}) =>
  createElement('heading', {
    content,
    style: {
      fontSize: 36,
      fontWeight: 'bold',
      color: style.color || '',
      textAlign: style.textAlign || 'left',
      ...style,
    },
  });

const makeText = (content, style = {}) =>
  createElement('text', {
    content,
    style: {
      fontSize: 16,
      color: style.color || '',
      textAlign: style.textAlign || 'left',
      ...style,
    },
  });

const makeButton = (content, link = '') =>
  createElement('button', {
    content,
    action: link
      ? {
          type: link.startsWith('http') ? 'external' : 'page',
          value: link,
          url: link,
        }
      : { type: 'none' },
    style: {
      fontSize: 14,
      fontWeight: 'semibold',
    },
  });

const makeImage = (src, alt = '') =>
  createElement('image', {
    src: src || '',
    content: '',
    settings: { alt },
    style: {
      width: '100%',
      height: 'auto',
      objectFit: 'cover',
    },
  });

/**
 * Converts editable content stored in legacy section settings
 * into independent native storefront elements.
 *
 * Dynamic sections such as products, services, bookings,
 * testimonials and navigation remain untouched.
 */
export function createEditableTemplateSection(section) {
  const settings = { ...(section.settings || {}) };
  const elements = [];

  switch (section.type) {
    case 'hero': {
      if (settings.eyebrow) {
        elements.push(
          makeText(settings.eyebrow, {
            fontSize: 12,
            fontWeight: 'semibold',
          })
        );
      }

      if (settings.title) {
        elements.push(
          makeHeading(settings.title, {
            fontSize: 48,
            fontWeight: 'bold',
            textAlign: settings.alignment || 'left',
            color: '#FFFFFF',
          })
        );
      }

      if (settings.subtitle) {
        elements.push(
          makeText(settings.subtitle, {
            fontSize: 18,
            textAlign: settings.alignment || 'left',
            color: '#FFFFFF',
          })
        );
      }

      if (settings.buttonText) {
        elements.push(
          makeButton(settings.buttonText, settings.buttonLink)
        );
      }

      settings.editableContent = true;
      break;
    }

    case 'about':
    case 'image_text': {
      if (settings.image) {
        elements.push(
          makeImage(settings.image, settings.title || 'Section image')
        );
      }

      if (settings.title) {
        elements.push(makeHeading(settings.title));
      }

      if (settings.subtitle) {
        elements.push(makeText(settings.subtitle, {
          fontSize: 18,
        }));
      }

      if (settings.description) {
        elements.push(makeText(settings.description));
      }

      settings.editableContent = true;
      break;
    }

    case 'rich_text':
    case 'custom_content': {
      if (settings.title) {
        elements.push(makeHeading(settings.title));
      }

      if (settings.subtitle) {
        elements.push(makeText(settings.subtitle, {
          fontSize: 18,
        }));
      }

      const body = settings.content || settings.description;

      if (body) {
        elements.push(makeText(body));
      }

      settings.editableContent = true;
      break;
    }

    case 'announcement': {
      if (settings.text) {
        elements.push(
          makeText(settings.text, {
            fontSize: 13,
            fontWeight: 'semibold',
            textAlign: 'center',
            color: '#FFFFFF',
          })
        );
      }

      settings.editableContent = true;
      break;
    }

    case 'footer': {
      if (settings.text) {
        elements.push(makeText(settings.text, {
          textAlign: 'center',
        }));
      }

      settings.editableContent = true;
      break;
    }

    default:
      return {
        ...section,
        settings,
        elements: section.elements || [],
      };
  }

  return {
    ...section,
    settings,
    elements,
  };
}
