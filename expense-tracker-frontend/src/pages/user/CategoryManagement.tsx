import CategoryManager from "../../components/Category/CategoryManager";
import Layout from "./Layout";

export default function CategoryManagement() {
  return (
    <Layout>
      {/* <div className="h-screen">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <main className="lg:col-span-6">
            <div className="bg-white dark:bg-gray-900/50 p-1 rounded-[1.25rem] border border-gray-100 dark:border-gray-800 shadow-sm ">
            </div>
          </main>
        </div>
      </div> */}
      <CategoryManager />
    </Layout>
  );
}
