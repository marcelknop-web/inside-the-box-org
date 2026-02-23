import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
  title: string;
  description: string;
}

export const PageMeta = ({ title, description }: PageMetaProps) => {
  const fullTitle = 'inside-the-box.org';
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
};
