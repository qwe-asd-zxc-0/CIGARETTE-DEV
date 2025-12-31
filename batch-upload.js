require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- 配置区域 ---
const EXCEL_FILE = 'products.xlsx'; 
const IMAGE_FOLDER = './raw_images'; 
const BUCKET_NAME = 'product-images'; 

// 1. 检查 Service Role Key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 错误: .env.local 中缺少 SUPABASE_SERVICE_ROLE_KEY。");
    process.exit(1);
}

// 2. 初始化 Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY 
);

async function main() {
    try {
        console.log(`📖 正在读取 Excel: ${EXCEL_FILE}...`);
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`📂 正在扫描图片文件夹: ${IMAGE_FOLDER}...`);
        if (!fs.existsSync(IMAGE_FOLDER)) {
            console.error(`❌ 错误: 找不到文件夹 ${IMAGE_FOLDER}`);
            return;
        }

        // 读取并自然排序图片
        const files = fs.readdirSync(IMAGE_FOLDER)
            .filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i))
            .sort((a, b) => {
                const numA = (a.match(/\d+/) || [0])[0];
                const numB = (b.match(/\d+/) || [0])[0];
                return parseInt(numA) - parseInt(numB);
            });

        console.log(`📊 Excel 商品数: ${data.length}`);
        console.log(`🖼️ 提取图片数: ${files.length}`);

        if (files.length === 0) {
            console.error("❌ 错误: 图片文件夹是空的！");
            return;
        }

        const results = [];

        // --- 循环上传 ---
        for (let i = 0; i < files.length; i++) {
            if (!data[i]) break; 

            const row = data[i];
            const originalImageName = files[i];
            
            // 获取商品名 (仅用于记录到 Excel，不用于文件名)
            const productName = row['商品名称 (Product Title)'] || row['Product Title'] || `product-${i}`;
            
            // 获取扩展名
            const extension = path.extname(originalImageName);

            // 🛑 终极解决方案：使用纯数字编号作为文件名 (如 img-0001.jpg)
            // 这样 Supabase 绝对不会报错
            const safeFileName = `img-${(i + 1).toString().padStart(4, '0')}${extension}`;

            const filePath = path.join(IMAGE_FOLDER, originalImageName);
            const fileBuffer = fs.readFileSync(filePath);

            console.log(`[${i+1}/${files.length}] 上传中: ${safeFileName} (原名: ${productName})`);

            // 上传
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(`batch/${safeFileName}`, fileBuffer, { 
                    contentType: 'image/jpeg',
                    upsert: true 
                });

            if (error) {
                console.error(`   ❌ 失败: ${error.message}`);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(`batch/${safeFileName}`);
                
                console.log(`   ✅ 成功`);

                // 记录到结果数组
                results.push({
                    "商品名称": productName,
                    "Supabase链接": publicUrl,  // 这里就是你要的URL
                    "原图片名": originalImageName
                });
            }
        }

        // --- 导出结果 ---
        console.log("💾 正在保存结果表格...");
        const newWs = XLSX.utils.json_to_sheet(results);
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, newWs, "UploadResult");
        XLSX.writeFile(newWb, "final_image_links.xlsx");

        console.log("\n🎉 全部完成！请打开 final_image_links.xlsx 查看结果");

    } catch (err) {
        console.error("💥 程序错误:", err);
    }
}

main();