import { useParams } from 'react-router-dom';
import { StorefrontHome } from './StorefrontHome.jsx';

export function StorefrontPage() {
  const { pageSlug } = useParams();

  return <StorefrontHome pageSlug={pageSlug} />;
}
