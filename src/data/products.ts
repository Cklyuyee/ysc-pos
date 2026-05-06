/**
 * Yongcharoen Product Inventory
 * ข้อมูลสินค้าจริง — Excel: ข้อมูลลค. YMNA กับสินค้าที่อยากให้ใส่บนระบบ fig.xlsx
 * Sheet: Master_product (56 รายการ) + Test case products (2 รายการ)
 * + SAMPLE_PRODUCTS: 200 SKU จาก ConX extract (ราคา/สต็อก mock)
 *
 * VAT Rule:
 *   V = ราคารวม VAT แล้ว (ทุกลูกค้าจ่ายราคาเดิม)
 *   I = ราคาไม่รวม VAT (ลูกค้าประเภท Y บวก 7% เพิ่มตอน checkout)
 */
import {
  SAMPLE_PRODUCTS,
  SAMPLE_GROUP_ASSIGNMENTS,
  SAMPLE_GROUP_OID_MAP,
  SAMPLE_GROUP_META,
  SAMPLE_GROUP_VARIANT_CONFIG,
} from './products_sample';

export interface Product {
  // ─── Core (required) ─────────────────────────────────────────
  SKU_OID: string;           // PRODUCT_SKU_OID
  Barcode_ID: string;        // BARCODE_ID
  ProductName_TH: string;    // PRODUCT_NAME
  UnitName_TH: string;       // UNIT_NAME
  Status: 'Active' | 'Inactive' | 'Discontinued'; // STATUS: A=Active
  Category_L1: string;
  Category_L2: string;
  Category_L3?: string;       // CATE_NAME (level 3) — optional, ConX may leave blank
  Category_L4?: string;       // CATE_NAME (level 4) — optional, mostly placeholder in ConX
  Brand: string;
  Tax_Type: 'V' | 'I';      // VAT_TYPE — V=ราคารวม VAT, I=ราคาไม่รวม VAT
  Price_P5: number;          // P5_INCVAT
  Price_P4: number;          // P4_INCVAT
  Price_P3: number;          // P3_INCVAT
  Price_P2: number;          // P2_INCVAT
  Price_P1: number;          // P1_INCVAT
  Stock_Online: number;
  Stock_Offline: number;
  Location_ID: string;       // SALE_AREA จาก ConX: 8 หลักติดกัน เช่น 30450101
  Location_ID_Online?: string;    // ตำแหน่งในคลัง Online (ชั้น 2-4) — ถ้ามีทั้งหน้าร้านและออนไลน์
  Is_Oversize: boolean;
  Is_Fragile: boolean;       // แตกหักง่าย

  // ─── Extended — from CSV (optional) ──────────────────────────
  Product_OID?: string;           // PRODUCT_OID
  ProductName_EN?: string;        // PRODUCT_NAME_ENG
  UnitName_EN?: string;           // UNIT_NAME_ENG
  Standard_Price?: number;        // STANDARD_PRICE — ราคามาตรฐาน
  Packaging_Cost?: number;        // ราคาค่าบรรจุภัณฑ์
  Multiplier?: number;            // MULTIPLIER — จำนวนต่อหน่วยบรรจุ
  VAT_Discount?: number;          // VAT_DISCOUNT
  Category_OID?: string;          // PRODUCT_CATEGORY_OID
  Product_Group_OID?: string;     // PRODUCT_GROUP_OID — กลุ่ม variant ใน ConX
  Product_Sup_Group_OID?: string; // PRODUCT_SUP_GROUP_OID
  Product_Group_Web_OID?: string; // PRODUCT_GROUP_WEB_OID
  Product_Place_OID?: string;     // PRODUCT_PLACE_OID
  Product_Type_OID?: string;      // PRODUCT_TYPE_OID
  Control_Serial?: boolean;       // CONTROL_SERIAL
  Control_Lot?: boolean;          // CONTROL_LOT
  Warranty_Days?: number;         // WARRANTEE_DAY
  Warranty_From_Sell?: boolean;   // START_WARRANTEE_FROM_SELL_DATE
  Is_Consign?: boolean;           // IS_CONSIGN_PRODUCT
  Is_Price_Required?: boolean;    // IS_PRICE_REQUIRE
  Is_Production_Order?: boolean;  // IS_PRODUCTION_ORDER
  Is_Deduct_WHT?: boolean;        // IS_DEDUCT_WHT
  WHT_Rate?: number;              // WHT_RATE
  Reorder_QTY?: number;           // REORDER_QTY — จุดสั่งซื้อ
  Safety_Stock_QTY?: number;      // SAFETY_STOCK_QTY — สต็อกสำรอง
  Min_Order_QTY?: number;         // MINIMUM_ORDER_QTY — สั่งซื้อขั้นต่ำ
  Max_Stock_QTY?: number;         // MAXIMUM_STOCK_QTY — สต็อกสูงสุด
  Remark?: string;                // ITEM_REMARK — หมายเหตุ
  ProductName_Web?: string;       // PRODUCT_NAME_WEB
  Short_Description?: string;     // PRODUCT_SHORT_DETAIL
  Full_Description?: string;      // PRODUCT_FULL_DETAIL
  Hashtags?: string;              // HASHTAG
  Ecommerce_Flag?: boolean;       // ECOMMERCE_FLAG — แสดงบน E-commerce
  Is_Out_Of_Stock?: boolean;      // OUT_OF_STOCK_FLAG
  Last_Sell_Date?: string;        // LAST_SELL_DATE
  Last_Purchase_Date?: string;    // LAST_PURCHASE_DATE
  Last_Buy_Date?: string;         // LAST_BUY_DATE
  Created_At?: string;            // CREATE_DTTM
  Created_By?: string;            // CREATE_USER
  Updated_By?: string;            // UPDATE_USER
  Updated_At?: string;            // UPDATE_DTTM
  Published_At?: string;          // PUBLISH_DTTM
  ConxSync_At?: string;           // CONXO_DTTM — วันที่ sync กับ ConX
  Sync_At?: string;               // SYNC_DTTM
  Cat1_OID?: string;              // CAT1
  Cat2_OID?: string;              // CAT2
  Cat3_OID?: string;              // CAT3
  Cat4_OID?: string;              // CAT4

  // ─── Platform-only (ไม่มีใน CSV) ─────────────────────────────
  Sales_Channels?: ('POS' | 'CC' | 'Web')[];  // ช่องทางการขาย
  Image_URLs?: string[];                        // รูปภาพ gallery (legacy)
  Variant_Label?: string;                       // ป้าย variant เช่น "สี", "ขนาด"

  // ─── Adeptio Extended Fields ──────────────────────────────────
  adeptio_name?: string;           // ชื่อสินค้า (Adeptio) — แยกจาก ConX
  adeptio_description?: string;    // รายละเอียด (HTML) — copy จาก ConX ครั้งแรก
  adeptio_specification?: string;  // ข้อมูลสินค้า/Specification (HTML)
  adeptio_images?: string[];       // รูปภาพ (Adeptio managed — ไม่ sync จาก ConX)
  group_id?: string;               // FK → ProductGroup (1 SKU : 1 group)
}

export const PRODUCTS: Product[] = [

  // ==========================================
  // Test case products (from "test case" sheet)
  // VAT Type V: กบเหลาดินสอ | VAT Type I: เชือกคล้องคอ
  // ==========================================
  {
    SKU_OID: '70001749',
    Barcode_ID: '00100175',
    ProductName_TH: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
    UnitName_TH: 'แพ็ค',
    Status: 'Active',
    Category_L1: 'เครื่องเขียน',
    Category_L2: 'กบเหลาดินสอ',
    Brand: 'นกฮูก',
    Tax_Type: 'V',
    Price_P5: 100,
    Price_P4: 90,
    Price_P3: 85,
    Price_P2: 80,
    Price_P1: 75,
    Stock_Online: 500,
    Stock_Offline: 100,
    Location_ID: '30450101',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70006031',
    Barcode_ID: '99804046',
    ProductName_TH: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
    UnitName_TH: 'เส้น',
    Status: 'Active',
    Category_L1: 'อุปกรณ์สำนักงาน',
    Category_L2: 'เชือกคล้องคอ',
    Brand: '-',
    Tax_Type: 'I',
    Price_P5: 50,
    Price_P4: 45,
    Price_P3: 40,
    Price_P2: 35,
    Price_P1: 30,
    Stock_Online: 1000,
    Stock_Offline: 200,
    Location_ID: '40120201',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // ==========================================
  // Master_product sheet — 56 รายการ
  // ==========================================

  // --- แฟ้ม ---
  {
    SKU_OID: '12152',
    Barcode_ID: '29800032',
    ProductName_TH: 'แฟ้ม 3 ห่วง A4 No.205 สะสมผลงาน (แพ็ค4เล่ม)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'แฟ้ม',
    Category_L2: 'แฟ้ม 3 ห่วง',
    Brand: 'Generic',
    Tax_Type: 'I',
    Price_P5: 447.26,
    Price_P4: 353.10,
    Price_P3: 342.40,
    Price_P2: 331.70,
    Price_P1: 321.00,
    Stock_Online: 50,
    Stock_Offline: 20,
    Location_ID: '20330503',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Champ กระดาษสีพื้น 2 สี (7 สี) ---
  {
    SKU_OID: '40003367',
    Barcode_ID: '30000742',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีฟ้า (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310802',
    Location_ID_Online: '20310802',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003368',
    Barcode_ID: '30000759',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีชมพู (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310703',
    Location_ID_Online: '20310703',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003369',
    Barcode_ID: '30000766',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีเขียวอ่อน (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310705',
    Location_ID_Online: '20310705',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003370',
    Barcode_ID: '30000773',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีเหลือง (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310704',
    Location_ID_Online: '20310704',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003371',
    Barcode_ID: '30000780',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีส้ม (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310702',
    Location_ID_Online: '20310702',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003372',
    Barcode_ID: '30000797',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีแดง (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310701',
    Location_ID_Online: '20310701',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003373',
    Barcode_ID: '30000803',
    ProductName_TH: 'Champ กระดาษสีพื้น 2 สี A4 สีม่วง (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษสีพื้น',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 81.32,
    Price_P4: 67.41,
    Price_P3: 64.20,
    Price_P2: 60.99,
    Price_P1: 58.85,
    Stock_Online: 200,
    Stock_Offline: 50,
    Location_ID: '10310801',
    Location_ID_Online: '20310801',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง (7 สี) ---
  {
    SKU_OID: '40003393',
    Barcode_ID: '30000810',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 สีเหลือง (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10300801',
    Location_ID_Online: '20300801',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003395',
    Barcode_ID: '30000834',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 สีเขียว (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10300804',
    Location_ID_Online: '20300804',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003396',
    Barcode_ID: '30000841',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 สีส้ม (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10300805',
    Location_ID_Online: '20300805',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003397',
    Barcode_ID: '30000858',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 สีฟ้า (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10310902',
    Location_ID_Online: '20310902',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003398',
    Barcode_ID: '30000865',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 สีแดง (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10300803',
    Location_ID_Online: '20300803',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40003399',
    Barcode_ID: '30000872',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 สีชมพู (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10300802',
    Location_ID_Online: '20300802',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70001567',
    Barcode_ID: '30001145',
    ProductName_TH: 'Champ กระดาษการ์ดสีน้ำ แชมป์ ลายหนังช้าง A4 สีม่วง (แพ็ค50แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'กระดาษ',
    Category_L2: 'กระดาษการ์ด',
    Brand: 'Champ',
    Tax_Type: 'I',
    Price_P5: 80.25,
    Price_P4: 65.27,
    Price_P3: 62.06,
    Price_P2: 58.85,
    Price_P1: 56.71,
    Stock_Online: 150,
    Stock_Offline: 30,
    Location_ID: '10310901',
    Location_ID_Online: '20310901',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Suzuki สายกีตาร์ ---
  {
    SKU_OID: '1158',
    Barcode_ID: '01500011',
    ProductName_TH: 'Suzuki สายกีตาร์ไฟฟ้า No.1 (แพ็ค12เส้น)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ดนตรี',
    Category_L2: 'สายกีตาร์',
    Brand: 'Suzuki',
    Tax_Type: 'V',
    Price_P5: 80,
    Price_P4: 67,
    Price_P3: 62,
    Price_P2: 57,
    Price_P1: 55,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11560508',
    Location_ID_Online: '21560508',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- ชุดเครื่องเขียนสังฆทาน (3 ขนาด) ---
  {
    SKU_OID: '70000719',
    Barcode_ID: '99802158',
    ProductName_TH: 'ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (แพ็ค1ชุด)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'เครื่องเขียน',
    Category_L2: 'ชุดสังฆทาน',
    Brand: 'YSC',
    Tax_Type: 'V',
    Price_P5: 90,
    Price_P4: 75,
    Price_P3: 70,
    Price_P2: 65,
    Price_P1: 64,
    Stock_Online: 100,
    Stock_Offline: 30,
    Location_ID: '10360502',
    Location_ID_Online: '30360502',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70000720',
    Barcode_ID: '99802165',
    ProductName_TH: 'ชุดเครื่องเขียน สังฆทาน ชุดกลาง (แพ็ค1ชุด)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'เครื่องเขียน',
    Category_L2: 'ชุดสังฆทาน',
    Brand: 'YSC',
    Tax_Type: 'V',
    Price_P5: 140,
    Price_P4: 120,
    Price_P3: 113,
    Price_P2: 107,
    Price_P1: 105,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '10360501',
    Location_ID_Online: '30360501',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70000721',
    Barcode_ID: '99802172',
    ProductName_TH: 'ชุดเครื่องเขียน สังฆทาน ชุดใหญ่ (แพ็ค1ชุด)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'เครื่องเขียน',
    Category_L2: 'ชุดสังฆทาน',
    Brand: 'YSC',
    Tax_Type: 'V',
    Price_P5: 280,
    Price_P4: 243,
    Price_P3: 231,
    Price_P2: 220,
    Price_P1: 216,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '10360401',
    Location_ID_Online: '30360401',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Staedtler ปากกาเขียนแผ่นใส 10 ด้าม/กล่อง (สีเดียว) ---
  {
    SKU_OID: '1691',
    Barcode_ID: '4007817332313',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีน้ำเงิน No.318-3F ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320411',
    Location_ID_Online: '31320411',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '1740',
    Barcode_ID: '4007817331651',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีน้ำเงิน No.313-3S ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320401',
    Location_ID_Online: '31320401',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011017',
    Barcode_ID: '4007817332177',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีน้ำเงิน No.317-3M ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320407',
    Location_ID_Online: '31320407',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011019',
    Barcode_ID: '4007817332160',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีแดง No.317-2M ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320408',
    Location_ID_Online: '31320408',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011020',
    Barcode_ID: '4007817332221',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีดำ No.317-9M ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320409',
    Location_ID_Online: '31320409',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011021',
    Barcode_ID: '4007817332375',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีเขียว No.318-5F ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320414',
    Location_ID_Online: '31320414',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011022',
    Barcode_ID: '4007817332276',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีแดง No.318-2F ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320412',
    Location_ID_Online: '31320412',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011023',
    Barcode_ID: '4007817332474',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีดำ No.318-9F ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320413',
    Location_ID_Online: '31320413',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011039',
    Barcode_ID: '4007817331675',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีเขียว No.313-5S ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320403',
    Location_ID_Online: '31320403',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011040',
    Barcode_ID: '4007817331644',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีแดง No.313-2S ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320402',
    Location_ID_Online: '31320402',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011041',
    Barcode_ID: '4007817331705',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีดำ No.313-9S ลบไม่ได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320404',
    Location_ID_Online: '31320404',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10011043',
    Barcode_ID: '4007817331460',
    ProductName_TH: 'Staedtler เขียนแผ่นใส สีเขียว No.311-5S ลบได้ (แพ็ค10ด้าม)',
    UnitName_TH: 'กล่อง',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 362,
    Price_P4: 345,
    Price_P3: 330,
    Price_P2: 320,
    Price_P1: 315,
    Stock_Online: 60,
    Stock_Offline: 15,
    Location_ID: '11320406',
    Location_ID_Online: '31320406',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Staedtler ปากกาเขียนแผ่นใส 4 สี/ชุด ---
  {
    SKU_OID: '1695',
    Barcode_ID: '4007817310809',
    ProductName_TH: 'Staedtler เขียนแผ่นใส 4 สี No.318 F ลบไม่ได้ (แพ็ค4ด้าม)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ชุดปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 160,
    Price_P4: 140,
    Price_P3: 133,
    Price_P2: 126,
    Price_P1: 124,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11320201',
    Location_ID_Online: '31320201',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10061',
    Barcode_ID: '4007817308431',
    ProductName_TH: 'Staedtler เขียนแผ่นใส 4 สี No.313S ลบไม่ได้ (แพ็ค4ด้าม)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ชุดปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 160,
    Price_P4: 140,
    Price_P3: 133,
    Price_P2: 126,
    Price_P1: 124,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11320205',
    Location_ID_Online: '31320205',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10013723',
    Barcode_ID: '4007817304549',
    ProductName_TH: 'Staedtler เขียนแผ่นใส 4 สี No.316F ลบได้ (แพ็ค4ด้าม)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ชุดปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 160,
    Price_P4: 140,
    Price_P3: 133,
    Price_P2: 126,
    Price_P1: 124,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11320203',
    Location_ID_Online: '31320203',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10013725',
    Barcode_ID: '4007817309278',
    ProductName_TH: 'Staedtler เขียนแผ่นใส 4 สี No.315M ลบได้ (แพ็ค4ด้าม)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ชุดปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 160,
    Price_P4: 140,
    Price_P3: 133,
    Price_P2: 126,
    Price_P1: 124,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11320204',
    Location_ID_Online: '31320204',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '10013771',
    Barcode_ID: '4007817310380',
    ProductName_TH: 'Staedtler เขียนแผ่นใส 4 สี No.317M ลบไม่ได้ (แพ็ค4ด้าม)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ชุดปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 160,
    Price_P4: 140,
    Price_P3: 133,
    Price_P2: 126,
    Price_P1: 124,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11320202',
    Location_ID_Online: '31320202',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40000309',
    Barcode_ID: '4007817307748',
    ProductName_TH: 'Staedtler เขียนแผ่นใส 4 สี No.311S ลบได้ (แพ็ค4ด้าม)',
    UnitName_TH: 'ชุด',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ชุดปากกาเขียนแผ่นใส',
    Brand: 'Staedtler',
    Tax_Type: 'V',
    Price_P5: 160,
    Price_P4: 140,
    Price_P3: 133,
    Price_P2: 126,
    Price_P1: 124,
    Stock_Online: 80,
    Stock_Offline: 20,
    Location_ID: '11320206',
    Location_ID_Online: '31320206',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Quantum ปากกาลูกลื่น 500S (3 สี) ---
  {
    SKU_OID: '10011590',
    Barcode_ID: '18851907148697',
    ProductName_TH: 'Quantum ปากกาลูกลื่น เจลโล่พลัส ทัช No.500S 0.7 สีน้ำเงิน (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาลูกลื่น',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 192,
    Price_P4: 154,
    Price_P3: 148,
    Price_P2: 142,
    Price_P1: 140,
    Stock_Online: 300,
    Stock_Offline: 80,
    Location_ID: '11360304',
    Location_ID_Online: '31360304',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40000881',
    Barcode_ID: '18851907148703',
    ProductName_TH: 'Quantum ปากกาลูกลื่น เจลโล่พลัส ทัช No.500S 0.7 สีดำ (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาลูกลื่น',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 192,
    Price_P4: 154,
    Price_P3: 148,
    Price_P2: 142,
    Price_P1: 140,
    Stock_Online: 300,
    Stock_Offline: 80,
    Location_ID: '11360302',
    Location_ID_Online: '31360302',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40000882',
    Barcode_ID: '18851907148710',
    ProductName_TH: 'Quantum ปากกาลูกลื่น เจลโล่พลัส ทัช No.500S 0.7 สีแดง (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาลูกลื่น',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 192,
    Price_P4: 154,
    Price_P3: 148,
    Price_P2: 142,
    Price_P1: 140,
    Stock_Online: 300,
    Stock_Offline: 80,
    Location_ID: '11360303',
    Location_ID_Online: '31360303',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Quantum ปากกาเจล 1233 (3 สี) ---
  {
    SKU_OID: '40001906',
    Barcode_ID: '18851907134959',
    ProductName_TH: 'Quantum ปากกาเจล โลพลัส No.1233 0.5 สีน้ำเงิน (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเจล',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 92,
    Price_P4: 79,
    Price_P3: 73,
    Price_P2: 67,
    Price_P1: 65,
    Stock_Online: 400,
    Stock_Offline: 100,
    Location_ID: '11360404',
    Location_ID_Online: '31360404',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40001907',
    Barcode_ID: '18851907134973',
    ProductName_TH: 'Quantum ปากกาเจล โลพลัส No.1233 0.5 สีแดง (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเจล',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 92,
    Price_P4: 79,
    Price_P3: 73,
    Price_P2: 67,
    Price_P1: 65,
    Stock_Online: 400,
    Stock_Offline: 100,
    Location_ID: '11360403',
    Location_ID_Online: '31360403',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '40001908',
    Barcode_ID: '18851907134966',
    ProductName_TH: 'Quantum ปากกาเจล โลพลัส No.1233 0.5 สีดำ (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเจล',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 92,
    Price_P4: 79,
    Price_P3: 73,
    Price_P2: 67,
    Price_P1: 65,
    Stock_Online: 400,
    Stock_Offline: 100,
    Location_ID: '11360402',
    Location_ID_Online: '31360402',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- Quantum ปากกาเน้นข้อความ QH-710 (5 สี) ---
  {
    SKU_OID: '10008770',
    Barcode_ID: '18851907107335',
    ProductName_TH: 'Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเน้นข้อความ',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 170,
    Price_P4: 142,
    Price_P3: 135,
    Price_P2: 130,
    Price_P1: 128,
    Stock_Online: 250,
    Stock_Offline: 60,
    Location_ID: '11420301',
    Location_ID_Online: '31420301',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70005572',
    Barcode_ID: '18851907104686',
    ProductName_TH: 'Quantum ปากกาเน้นข้อความ QH-710 สีฟ้า (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเน้นข้อความ',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 170,
    Price_P4: 142,
    Price_P3: 135,
    Price_P2: 130,
    Price_P1: 128,
    Stock_Online: 250,
    Stock_Offline: 60,
    Location_ID: '11420302',
    Location_ID_Online: '31420302',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70005574',
    Barcode_ID: '18851907107342',
    ProductName_TH: 'Quantum ปากกาเน้นข้อความ QH-710 สีชมพู (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเน้นข้อความ',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 170,
    Price_P4: 142,
    Price_P3: 135,
    Price_P2: 130,
    Price_P1: 128,
    Stock_Online: 250,
    Stock_Offline: 60,
    Location_ID: '11420305',
    Location_ID_Online: '31420305',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70005575',
    Barcode_ID: '18851907107359',
    ProductName_TH: 'Quantum ปากกาเน้นข้อความ QH-710 สีเขียว (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเน้นข้อความ',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 170,
    Price_P4: 142,
    Price_P3: 135,
    Price_P2: 130,
    Price_P1: 128,
    Stock_Online: 250,
    Stock_Offline: 60,
    Location_ID: '11420303',
    Location_ID_Online: '31420303',
    Is_Oversize: false,
    Is_Fragile: false,
  },
  {
    SKU_OID: '70005577',
    Barcode_ID: '18851907107366',
    ProductName_TH: 'Quantum ปากกาเน้นข้อความ QH-710 สีส้ม (แพ็ค12ด้าม)',
    UnitName_TH: 'โหล',
    Status: 'Active',
    Category_L1: 'ปากกา',
    Category_L2: 'ปากกาเน้นข้อความ',
    Brand: 'Quantum',
    Tax_Type: 'V',
    Price_P5: 170,
    Price_P4: 142,
    Price_P3: 135,
    Price_P2: 130,
    Price_P1: 128,
    Stock_Online: 250,
    Stock_Offline: 60,
    Location_ID: '11420304',
    Location_ID_Online: '31420304',
    Is_Oversize: false,
    Is_Fragile: false,
  },

  // --- MEE แผ่นอะครีลิคใส 30x30 ซม. ---
  {
    SKU_OID: '40003279',
    Barcode_ID: '08000163',
    ProductName_TH: 'MEE แผ่นอะครีลิคใส 30 x 30 ซม. หนา 1 มม. (แพ็ค20แผ่น)',
    UnitName_TH: 'แพ็ค',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'V',
    Price_P5: 665,
    Price_P4: 530,
    Price_P3: 510,
    Price_P2: 490,
    Price_P1: 470,
    Stock_Online: 40,
    Stock_Offline: 10,
    Location_ID: '10850201',
    Location_ID_Online: '30850201',
    Is_Oversize: false,
    Is_Fragile: true,
  },
  {
    SKU_OID: '70001417',
    Barcode_ID: '08000316',
    ProductName_TH: 'MEE แผ่นอะครีลิคใส 30 x 30 ซม. หนา 2 มม. (แพ็ค20แผ่น)',
    UnitName_TH: 'ห่อ',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'V',
    Price_P5: 1190,
    Price_P4: 940,
    Price_P3: 910,
    Price_P2: 880,
    Price_P1: 870,
    Stock_Online: 30,
    Stock_Offline: 8,
    Location_ID: '10850202',
    Location_ID_Online: '30850202',
    Is_Oversize: false,
    Is_Fragile: true,
  },

  // --- Pre-Order แผ่นอะครีลิคใส (ราย แผ่น) ---
  {
    SKU_OID: '70001225',
    Barcode_ID: '08000255',
    ProductName_TH: 'Pre-Order แผ่นอะครีลิคใส A1 หนา 1 มม.',
    UnitName_TH: 'แผ่น',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'I',
    Price_P5: 279.27,
    Price_P4: 155.15,
    Price_P3: 149.80,
    Price_P2: 139.10,
    Price_P1: 139.10,
    Stock_Online: 0,
    Stock_Offline: 0,
    Location_ID: '23020101',
    Is_Oversize: true,
    Is_Fragile: true,
  },
  {
    SKU_OID: '70001226',
    Barcode_ID: '08000262',
    ProductName_TH: 'Pre-Order แผ่นอะครีลิคใส A2 หนา 1 มม.',
    UnitName_TH: 'แผ่น',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'I',
    Price_P5: 141.24,
    Price_P4: 78.11,
    Price_P3: 74.90,
    Price_P2: 69.55,
    Price_P1: 66.34,
    Stock_Online: 0,
    Stock_Offline: 0,
    Location_ID: '23020102',
    Is_Oversize: true,
    Is_Fragile: true,
  },
  {
    SKU_OID: '70001227',
    Barcode_ID: '08000279',
    ProductName_TH: 'Pre-Order แผ่นอะครีลิคใส A3 หนา 1 มม.',
    UnitName_TH: 'แผ่น',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'I',
    Price_P5: 73.83,
    Price_P4: 40.66,
    Price_P3: 38.52,
    Price_P2: 35.31,
    Price_P1: 35.31,
    Stock_Online: 0,
    Stock_Offline: 0,
    Location_ID: '23020103',
    Is_Oversize: true,
    Is_Fragile: true,
  },
  {
    SKU_OID: '70001228',
    Barcode_ID: '08000286',
    ProductName_TH: 'Pre-Order แผ่นอะครีลิคใส A3 หนา 2 มม.',
    UnitName_TH: 'แผ่น',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'I',
    Price_P5: 124.12,
    Price_P4: 68.48,
    Price_P3: 65.27,
    Price_P2: 59.92,
    Price_P1: 59.92,
    Stock_Online: 0,
    Stock_Offline: 0,
    Location_ID: '23020201',
    Is_Oversize: true,
    Is_Fragile: true,
  },
  {
    SKU_OID: '70001273',
    Barcode_ID: '08000293',
    ProductName_TH: 'Pre-Order แผ่นอะครีลิคใส A2 หนา 2 มม.',
    UnitName_TH: 'แผ่น',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'I',
    Price_P5: 231.12,
    Price_P4: 128.40,
    Price_P3: 123.05,
    Price_P2: 117.70,
    Price_P1: 113.42,
    Stock_Online: 0,
    Stock_Offline: 0,
    Location_ID: '23020202',
    Is_Oversize: true,
    Is_Fragile: true,
  },
  {
    SKU_OID: '70001274',
    Barcode_ID: '08000309',
    ProductName_TH: 'Pre-Order แผ่นอะครีลิคใส A2 หนา 3 มม.',
    UnitName_TH: 'แผ่น',
    Status: 'Active',
    Category_L1: 'อะครีลิค',
    Category_L2: 'แผ่นอะครีลิค',
    Brand: 'MEE',
    Tax_Type: 'I',
    Price_P5: 304.95,
    Price_P4: 169.06,
    Price_P3: 163.71,
    Price_P2: 158.36,
    Price_P1: 155.15,
    Stock_Online: 0,
    Stock_Offline: 0,
    Location_ID: '23020301',
    Is_Oversize: true,
    Is_Fragile: true,
  },
  ...SAMPLE_PRODUCTS,
];

/**
 * Product Group OID Assignments
 * สินค้าที่มี PRODUCT_GROUP_OID เดียวกัน = variants ของสินค้าชนิดเดียวกัน
 */
export const PRODUCT_GROUP_ASSIGNMENTS: Record<string, string> = {
  // GRP-001: Champ กระดาษสีพื้น 2 สี A4 (7 สี)
  '40003367': 'GRP-001', '40003368': 'GRP-001', '40003369': 'GRP-001',
  '40003370': 'GRP-001', '40003371': 'GRP-001', '40003372': 'GRP-001', '40003373': 'GRP-001',
  // GRP-002: Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4 (7 สี)
  '40003393': 'GRP-002', '40003395': 'GRP-002', '40003396': 'GRP-002', '40003397': 'GRP-002',
  '40003398': 'GRP-002', '40003399': 'GRP-002', '70001567': 'GRP-002',
  // GRP-003: ชุดเครื่องเขียนสังฆทาน (3 ขนาด: เล็ก/กลาง/ใหญ่)
  '70000719': 'GRP-003', '70000720': 'GRP-003', '70000721': 'GRP-003',
  // GRP-004: Staedtler ปากกาเขียนแผ่นใส สีเดียว/กล่อง (12 รุ่น)
  '1691': 'GRP-004', '1740': 'GRP-004', '10011017': 'GRP-004', '10011019': 'GRP-004',
  '10011020': 'GRP-004', '10011021': 'GRP-004', '10011022': 'GRP-004', '10011023': 'GRP-004',
  '10011039': 'GRP-004', '10011040': 'GRP-004', '10011041': 'GRP-004', '10011043': 'GRP-004',
  // GRP-005: Staedtler ปากกาเขียนแผ่นใส 4 สี/ชุด (6 รุ่น)
  '1695': 'GRP-005', '10061': 'GRP-005', '10013723': 'GRP-005', '10013725': 'GRP-005',
  '10013771': 'GRP-005', '40000309': 'GRP-005',
  // GRP-006: Quantum ปากกาลูกลื่น เจลโล่พลัส No.500S (3 สี)
  '10011590': 'GRP-006', '40000881': 'GRP-006', '40000882': 'GRP-006',
  // GRP-007: Quantum ปากกาเจล โลพลัส No.1233 (3 สี)
  '40001906': 'GRP-007', '40001907': 'GRP-007', '40001908': 'GRP-007',
  // GRP-008: Quantum ปากกาเน้นข้อความ QH-710 (5 สี)
  '10008770': 'GRP-008', '70005572': 'GRP-008', '70005574': 'GRP-008',
  '70005575': 'GRP-008', '70005577': 'GRP-008',
  // GRP-009: MEE แผ่นอะครีลิคใส 30×30 ซม. (2 ความหนา)
  '40003279': 'GRP-009', '70001417': 'GRP-009',
  // GRP-010: Pre-Order แผ่นอะครีลิคใส (6 ขนาด/ความหนา)
  '70001225': 'GRP-010', '70001226': 'GRP-010', '70001227': 'GRP-010',
  '70001228': 'GRP-010', '70001273': 'GRP-010', '70001274': 'GRP-010',
  ...SAMPLE_GROUP_ASSIGNMENTS,
};

export function getProductGroupOID(sku: string): string {
  return PRODUCT_GROUP_ASSIGNMENTS[sku] ?? '';
}

/**
 * แผนที่จาก internal Group ID (GRP-xxx) → PRODUCT_GROUP_OID จริงจาก ConX
 * ใช้สำหรับแสดงเลข OID ที่ถูกต้องในหน้า ProductGroups / ProductDetail
 * กลุ่มที่ไม่มี PRODUCT_GROUP_OID ใน ConX ให้เว้นว่าง ''
 */
export const GROUP_OID_MAP: Record<string, string> = {
  'GRP-001': '40000586',  // Champ กระดาษสีพื้น 2 สี A4
  'GRP-002': '40000589',  // Champ กระดาษการ์ดสีน้ำ ลายหนังช้าง A4
  'GRP-003': '',          // ชุดเครื่องเขียนสังฆทาน — ไม่มี OID ใน ConX
  'GRP-004': '40000024',  // Staedtler เขียนแผ่นใส รายด้าม/กล่อง
  'GRP-005': '40000026',  // Staedtler เขียนแผ่นใส ชุด 4 สี
  'GRP-006': '40000134',  // Quantum ปากกาลูกลื่น No.500S
  'GRP-007': '40000434',  // Quantum ปากกาเจล No.1233
  'GRP-008': '70000407',  // Quantum ปากกาเน้นข้อความ QH-710
  'GRP-009': '',          // MEE แผ่นอะครีลิคใส 30×30 — ไม่มี OID ใน ConX
  'GRP-010': '',          // Pre-Order แผ่นอะครีลิคใส — ไม่มี OID ใน ConX
  ...SAMPLE_GROUP_OID_MAP,
};

/**
 * Group Variant Configuration
 * กำหนดโครงสร้าง Choice dimensions และ mapping SKU ของแต่ละกลุ่มสินค้า
 */

export interface GroupChoiceDef {
  label: string;    // e.g. "สี", "รุ่น", "ความหนา"
  values: string[]; // e.g. ["สีน้ำเงิน", "สีแดง", ...]
}

export interface GroupVariantEntry {
  sku: string;
  c1: string;
  c2?: string;
  c3?: string;
}

export interface GroupVariantConfig {
  choices: GroupChoiceDef[]; // 1–3 choice dimensions
  variantMap: GroupVariantEntry[];
}

export const GROUP_VARIANT_CONFIG: Record<string, GroupVariantConfig> = {
  // ──────────────────────────────────────────────────────────
  // GRP-001: Champ กระดาษสีพื้น — Choice 1: สี (7 สี)
  // ──────────────────────────────────────────────────────────
  'GRP-001': {
    choices: [
      { label: 'สี', values: ['สีฟ้า', 'สีชมพู', 'สีเขียวอ่อน', 'สีเหลือง', 'สีส้ม', 'สีแดง', 'สีม่วง'] },
    ],
    variantMap: [
      { sku: '40003367', c1: 'สีฟ้า' },
      { sku: '40003368', c1: 'สีชมพู' },
      { sku: '40003369', c1: 'สีเขียวอ่อน' },
      { sku: '40003370', c1: 'สีเหลือง' },
      { sku: '40003371', c1: 'สีส้ม' },
      { sku: '40003372', c1: 'สีแดง' },
      { sku: '40003373', c1: 'สีม่วง' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-002: Champ กระดาษการ์ดสีน้ำ — Choice 1: สี (7 สี)
  // ──────────────────────────────────────────────────────────
  'GRP-002': {
    choices: [
      { label: 'สี', values: ['สีเหลือง', 'สีเขียว', 'สีส้ม', 'สีฟ้า', 'สีแดง', 'สีชมพู', 'สีม่วง'] },
    ],
    variantMap: [
      { sku: '40003393', c1: 'สีเหลือง' },
      { sku: '40003395', c1: 'สีเขียว' },
      { sku: '40003396', c1: 'สีส้ม' },
      { sku: '40003397', c1: 'สีฟ้า' },
      { sku: '40003398', c1: 'สีแดง' },
      { sku: '40003399', c1: 'สีชมพู' },
      { sku: '70001567', c1: 'สีม่วง' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-003: สังฆทาน — Choice 1: ขนาด (3 ขนาด)
  // ──────────────────────────────────────────────────────────
  'GRP-003': {
    choices: [
      { label: 'ขนาด', values: ['ชุดเล็ก', 'ชุดกลาง', 'ชุดใหญ่'] },
    ],
    variantMap: [
      { sku: '70000719', c1: 'ชุดเล็ก' },
      { sku: '70000720', c1: 'ชุดกลาง' },
      { sku: '70000721', c1: 'ชุดใหญ่' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-004: Staedtler สีเดียว/กล่อง
  //   Choice 1: สี | Choice 2: รุ่น | Choice 3: ลบ
  //   (ไม่ใช่ทุก combination มี SKU)
  // ──────────────────────────────────────────────────────────
  'GRP-004': {
    choices: [
      { label: 'สี',  values: ['สีน้ำเงิน', 'สีแดง', 'สีเขียว', 'สีดำ'] },
      { label: 'รุ่น', values: ['No.311S', 'No.313S', 'No.317M', 'No.318F'] },
      { label: 'ลบ',  values: ['ลบไม่ได้', 'ลบได้'] },
    ],
    variantMap: [
      { sku: '1691',     c1: 'สีน้ำเงิน', c2: 'No.318F', c3: 'ลบไม่ได้' },
      { sku: '1740',     c1: 'สีน้ำเงิน', c2: 'No.313S', c3: 'ลบไม่ได้' },
      { sku: '10011017', c1: 'สีน้ำเงิน', c2: 'No.317M', c3: 'ลบไม่ได้' },
      { sku: '10011019', c1: 'สีแดง',     c2: 'No.317M', c3: 'ลบไม่ได้' },
      { sku: '10011020', c1: 'สีดำ',      c2: 'No.317M', c3: 'ลบไม่ได้' },
      { sku: '10011021', c1: 'สีเขียว',   c2: 'No.318F', c3: 'ลบไม่ได้' },
      { sku: '10011022', c1: 'สีแดง',     c2: 'No.318F', c3: 'ลบไม่ได้' },
      { sku: '10011023', c1: 'สีดำ',      c2: 'No.318F', c3: 'ลบไม่ได้' },
      { sku: '10011039', c1: 'สีเขียว',   c2: 'No.313S', c3: 'ลบไม่ได้' },
      { sku: '10011040', c1: 'สีแดง',     c2: 'No.313S', c3: 'ลบไม่ได้' },
      { sku: '10011041', c1: 'สีดำ',      c2: 'No.313S', c3: 'ลบไม่ได้' },
      { sku: '10011043', c1: 'สีเขียว',   c2: 'No.311S', c3: 'ลบได้' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-005: Staedtler 4สี/ชุด
  //   Choice 1: รุ่น | Choice 2: ลบ
  // ──────────────────────────────────────────────────────────
  'GRP-005': {
    choices: [
      { label: 'รุ่น', values: ['No.311S', 'No.313S', 'No.315M', 'No.316F', 'No.317M', 'No.318F'] },
      { label: 'ลบ',  values: ['ลบไม่ได้', 'ลบได้'] },
    ],
    variantMap: [
      { sku: '1695',     c1: 'No.318F', c2: 'ลบไม่ได้' },
      { sku: '10061',    c1: 'No.313S', c2: 'ลบไม่ได้' },
      { sku: '10013723', c1: 'No.316F', c2: 'ลบได้' },
      { sku: '10013725', c1: 'No.315M', c2: 'ลบได้' },
      { sku: '10013771', c1: 'No.317M', c2: 'ลบไม่ได้' },
      { sku: '40000309', c1: 'No.311S', c2: 'ลบได้' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-006: Quantum 500S — Choice 1: สี (3 สี)
  // ──────────────────────────────────────────────────────────
  'GRP-006': {
    choices: [
      { label: 'สี', values: ['สีน้ำเงิน', 'สีดำ', 'สีแดง'] },
    ],
    variantMap: [
      { sku: '10011590', c1: 'สีน้ำเงิน' },
      { sku: '40000881', c1: 'สีดำ' },
      { sku: '40000882', c1: 'สีแดง' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-007: Quantum 1233 — Choice 1: สี (3 สี)
  // ──────────────────────────────────────────────────────────
  'GRP-007': {
    choices: [
      { label: 'สี', values: ['สีน้ำเงิน', 'สีแดง', 'สีดำ'] },
    ],
    variantMap: [
      { sku: '40001906', c1: 'สีน้ำเงิน' },
      { sku: '40001907', c1: 'สีแดง' },
      { sku: '40001908', c1: 'สีดำ' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-008: Quantum QH-710 — Choice 1: สี (5 สี)
  // ──────────────────────────────────────────────────────────
  'GRP-008': {
    choices: [
      { label: 'สี', values: ['สีเหลือง', 'สีฟ้า', 'สีชมพู', 'สีเขียว', 'สีส้ม'] },
    ],
    variantMap: [
      { sku: '10008770', c1: 'สีเหลือง' },
      { sku: '70005572', c1: 'สีฟ้า' },
      { sku: '70005574', c1: 'สีชมพู' },
      { sku: '70005575', c1: 'สีเขียว' },
      { sku: '70005577', c1: 'สีส้ม' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-009: MEE 30×30 ซม. — Choice 1: ความหนา (2 แบบ)
  // ──────────────────────────────────────────────────────────
  'GRP-009': {
    choices: [
      { label: 'ความหนา', values: ['1 มม.', '2 มม.'] },
    ],
    variantMap: [
      { sku: '40003279', c1: '1 มม.' },
      { sku: '70001417', c1: '2 มม.' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // GRP-010: Pre-Order อะครีลิคใส
  //   Choice 1: ขนาด | Choice 2: ความหนา
  // ──────────────────────────────────────────────────────────
  'GRP-010': {
    choices: [
      { label: 'ขนาด',    values: ['A1', 'A2', 'A3'] },
      { label: 'ความหนา', values: ['1 มม.', '2 มม.', '3 มม.'] },
    ],
    variantMap: [
      { sku: '70001225', c1: 'A1', c2: '1 มม.' },
      { sku: '70001226', c1: 'A2', c2: '1 มม.' },
      { sku: '70001227', c1: 'A3', c2: '1 มม.' },
      { sku: '70001228', c1: 'A3', c2: '2 มม.' },
      { sku: '70001273', c1: 'A2', c2: '2 มม.' },
      { sku: '70001274', c1: 'A2', c2: '3 มม.' },
    ],
  },
  ...SAMPLE_GROUP_VARIANT_CONFIG,
};

/**
 * Helper Functions
 */

// ค้นหาสินค้าด้วย SKU
export function getProductBySKU(sku: string): Product | undefined {
  return PRODUCTS.find(p => p.SKU_OID === sku);
}

// ค้นหาสินค้าด้วย Barcode
export function getProductByBarcode(barcode: string): Product | undefined {
  return PRODUCTS.find(p => p.Barcode_ID === barcode);
}

// ค้นหาสินค้าตามหมวดหมู่
export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter(p => p.Category_L1 === category);
}

// ค้นหาสินค้าตาม Brand
export function getProductsByBrand(brand: string): Product[] {
  return PRODUCTS.filter(p => p.Brand === brand);
}

// ค้นหาสินค้าตาม Location
export function getProductsByLocation(location: string): Product[] {
  return PRODUCTS.filter(p => p.Location_ID === location);
}

// ค้นหาสินค้าที่ Oversize
export function getOversizeProducts(): Product[] {
  return PRODUCTS.filter(p => p.Is_Oversize);
}

// ค้นหาสินค้าที่ Fragile
export function getFragileProducts(): Product[] {
  return PRODUCTS.filter(p => p.Is_Fragile);
}

// คำนวณราคาตาม Price Tier
export function getPriceByTier(product: Product, tier: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'): number {
  return product[`Price_${tier}`];
}

// ตรวจสอบสต็อค
export function checkStock(product: Product, channel: 'online' | 'offline'): {
  available: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
} {
  const stock = channel === 'online' ? product.Stock_Online : product.Stock_Offline;
  let status: 'in_stock' | 'low_stock' | 'out_of_stock';

  if (stock === 0) {
    status = 'out_of_stock';
  } else if (stock < 10) {
    status = 'low_stock';
  } else {
    status = 'in_stock';
  }

  return { available: stock, status };
}

// ค้นหาสินค้า (Full-text search)
export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return PRODUCTS.filter(p =>
    p.ProductName_TH.toLowerCase().includes(lowerQuery) ||
    p.SKU_OID.toLowerCase().includes(lowerQuery) ||
    p.Barcode_ID.includes(query) ||
    p.Brand.toLowerCase().includes(lowerQuery)
  );
}

// Group products by Category_L1
export function getProductCategories(): Map<string, Product[]> {
  const categories = new Map<string, Product[]>();

  PRODUCTS.forEach(product => {
    const cat = product.Category_L1;
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(product);
  });

  return categories;
}

// Get unique brands
export function getBrands(): string[] {
  return Array.from(new Set(PRODUCTS.map(p => p.Brand))).sort();
}

// Get unique locations (sorted by Location Code)
export function getLocations(): string[] {
  return Array.from(new Set(PRODUCTS.map(p => p.Location_ID))).sort();
}

/**
 * Price Tier Logic
 */
export function calculateEffectivePrice(
  product: Product,
  quantity: number,
  baseCartTotal: number,
  channel: 'online' | 'offline'
): {
  tier: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  unitPrice: number;
  totalPrice: number;
  upgraded: boolean;
} {
  // Default tier is P5
  let tier: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' = 'P5';
  let upgraded = false;

  // Auto-upgrade logic (P5 → P4)
  if (channel === 'offline' && baseCartTotal >= 4000) {
    tier = 'P4';
    upgraded = true;
  } else if (channel === 'online' && baseCartTotal >= 10000) {
    tier = 'P4';
    upgraded = true;
  }

  const unitPrice = getPriceByTier(product, tier);
  const totalPrice = unitPrice * quantity;

  return {
    tier,
    unitPrice,
    totalPrice,
    upgraded
  };
}
