export default function ProductDetail({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1>商品详情页 (ID: {params.id})</h1>
      <p>关联功能: 2.3, 数据库: products + reviews + faqs</p>
    </div>
  );
}