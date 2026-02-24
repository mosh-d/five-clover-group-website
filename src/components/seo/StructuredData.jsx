/**
 * StructuredData Component
 * Renders JSON-LD structured data for SEO purposes
 * @param {Object} props - Component props
 * @param {Object|Array} props.data - The structured data object(s) to render
 */
export default function StructuredData({ data }) {
  if (!data) return null;

  // Handle array of structured data objects
  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {dataArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
