// Newperson — လူသစ် မှတ်တမ်း (Factory new-hire recruiter app)
// Expo / React Native — single file. Data is stored on this phone only (AsyncStorage).
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, FlatList, Pressable, StyleSheet, StatusBar,
  Platform, Alert, Linking, Share, BackHandler, Animated, Easing, Modal, Switch,
  ActivityIndicator, Keyboard, AccessibilityInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

/* ───────────────────────── DESIGN TOKENS ───────────────────────── */
const C = {
  bg: '#0A0B10', surface: '#13151D', surface2: '#1B1E29', line: '#272B3A',
  text: '#F3F1EA', sub: '#A3A8BC', faint: '#646A80',
  lime: '#D4FF3A', limeInk: '#121700', coral: '#FF6A4D', sky: '#5CC8FF',
  violet: '#A193FF', amber: '#FFB547', green: '#3DDC97', red: '#FF5A6E',
};
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const R = { sm: 10, md: 16, lg: 22, pill: 999 };
const F = { xs: 11, sm: 13, md: 15, lg: 18, xl: 24, xxl: 34, huge: 56 };
const DUR = { fast: 160, base: 260, slow: 420 };
const TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

const STATUSES = ['lead', 'interview', 'docs', 'started', 'left', 'rejected'];
const STATUS_COLOR = {
  lead: C.sky, interview: C.violet, docs: C.amber, started: C.green, left: C.faint, rejected: C.red,
};
const STATUS_ICON = {
  lead: 'call-outline', interview: 'chatbubbles-outline', docs: 'document-text-outline',
  started: 'checkmark-done-outline', left: 'exit-outline', rejected: 'close-circle-outline',
};
const DOC_TYPES = ['passport', 'pink', 'ci', 'other'];
const AVATAR_COLORS = [C.lime, C.coral, C.sky, C.violet, C.amber, C.green];

const K = {
  people: 'np:people:v1', settings: 'np:settings:v1', draft: 'np:draft:v1', log: 'np:log:v1',
};

/* Fields the admin can make required (nameMm + phone are always required). */
const OPTIONAL_REQUIRED = [
  'nameEn', 'gender', 'dob', 'docNo', 'docExpiry', 'hometown', 'currentAddress',
  'dept', 'position', 'shift', 'startDate', 'emName', 'emPhone',
];

/* ───────────────────────── TRANSLATIONS ───────────────────────── */
const T = {
  my: {
    brand: 'လူသစ်', tagline: 'အလုပ်သမားသစ် မှတ်တမ်း',
    home: 'ပင်မ', people: 'စာရင်း', add: 'အသစ်', admin: 'Admin',
    hello: 'မင်္ဂလာပါ', total: 'လူသစ် စုစုပေါင်း', thisMonth: 'ဒီလ အလုပ်ဝင်', working: 'လက်ရှိ အလုပ်လုပ်နေ',
    pipeline: 'အဆင့်အလိုက်', alerts: 'သတိပေးချက်များ',
    expiringDocs: 'စာရွက်စာတမ်း သက်တမ်းကုန်တော့မည်', unverified: 'ဖုန်းနံပါတ် မစစ်ရသေး',
    unpaid: 'မရရသေးသော ခေါ်ပေးခ', recent: 'နောက်ဆုံး ထည့်ထားသူများ', seeAll: 'အားလုံးကြည့်',
    allGood: 'သတိပေးစရာ မရှိပါ — အားလုံး အဆင်ပြေတယ်',
    emptyTitle: 'လူသစ် မရှိသေးပါ', emptySub: 'အောက်က + ကိုနှိပ်ပြီး ပထမဆုံးလူကို ထည့်ပါ',
    search: 'နာမည်၊ ဖုန်း၊ စာရွက်နံပါတ် ရှာရန်', all: 'အားလုံး', noResults: 'ရှာမတွေ့ပါ',
    sortNew: 'အသစ်ဆုံး', sortName: 'နာမည်', sortStart: 'ဝင်ရက်', people_n: '{n} ယောက်',
    st_lead: 'ခေါ်ထားဆဲ', st_interview: 'အင်တာဗျူး', st_docs: 'စာရွက်လုပ်ဆဲ',
    st_started: 'အလုပ်ဝင်ပြီ', st_left: 'ထွက်သွားပြီ', st_rejected: 'မအောင်',
    secPersonal: 'ကိုယ်ရေး အချက်အလက်', secContact: 'ဆက်သွယ်ရန်', secDocs: 'စာရွက်စာတမ်း',
    secAddress: 'နေရပ်လိပ်စာ', secJob: 'အလုပ်', secEmergency: 'အရေးပေါ် ဆက်သွယ်ရန်', secFee: 'ခေါ်ပေးခ နှင့် မှတ်ချက်',
    nameMm: 'မြန်မာ နာမည်', nameEn: 'နာမည် (အင်္ဂလိပ်/ပတ်စပို့အတိုင်း)', nickname: 'ခေါ်နာမည်',
    gender: 'ကျား / မ', male: 'ကျား', female: 'မ', dob: 'မွေးသက္ကရာဇ်', age: 'အသက်', ageY: '{n} နှစ်',
    phone: 'ဖုန်းနံပါတ်', phoneConfirm: 'ဖုန်းနံပါတ် ထပ်ရိုက်ပါ (စစ်ရန်)', phone2: 'ဒုတိယ ဖုန်း',
    lineId: 'LINE ID', facebook: 'Facebook နာမည်', thai: 'ထိုင်း', myanmar: 'မြန်မာ',
    docType: 'စာရွက် အမျိုးအစား', dt_passport: 'ပတ်စပို့', dt_pink: 'ပန်းရောင်ကတ်', dt_ci: 'CI', dt_other: 'အခြား',
    docNo: 'စာရွက် နံပါတ်', docExpiry: 'သက်တမ်းကုန်ရက်',
    hometown: 'မြန်မာပြည် နေရပ်', currentAddress: 'လက်ရှိ နေရပ် (ထိုင်း)',
    dept: 'ဌာန', position: 'ရာထူး / အလုပ်', shift: 'အဆိုင်း', startDate: 'အလုပ်ဝင်ရက်', status: 'အခြေအနေ',
    emName: 'နာမည်', emRelation: 'တော်စပ်ပုံ', emPhone: 'ဖုန်းနံပါတ်',
    fee: 'ခေါ်ပေးခ (ဘတ်)', feePaid: 'ငွေရပြီ', notes: 'မှတ်ချက်',
    datePh: 'ရက်/လ/နှစ်', today: 'ယနေ့',
    required: 'ဖြည့်ရန် လိုအပ်သည်', badPhoneTH: 'ထိုင်းဖုန်း ဂဏန်း ၁၀ လုံး (06/08/09 နဲ့စ) ဖြစ်ရမည်',
    badPhoneMM: 'မြန်မာဖုန်း 09 နဲ့စပြီး ဂဏန်း ၉–၁၁ လုံး ဖြစ်ရမည်', phoneMismatch: 'ဖုန်းနံပါတ် နှစ်ခု မတူပါ — ပြန်စစ်ပါ',
    phoneMatch: 'ဖုန်းနံပါတ် ကိုက်ညီပါတယ်', dupPhone: 'ဒီဖုန်းက "{name}" မှာ ရှိပြီးသား', dupDoc: 'ဒီစာရွက်နံပါတ်က "{name}" မှာ ရှိပြီးသား',
    badDate: 'ရက်စွဲ မှားနေသည် (ရက်/လ/နှစ်)', under18: 'သတိ — အသက် ၁၈ နှစ်အောက်', expiredWarn: 'သတိ — သက်တမ်းကုန်နေပြီ',
    fixErrors: 'အနီရောင်ပြထားတဲ့ အကွက်တွေ ပြင်ပါ', badFee: 'ဂဏန်းသာ ရိုက်ပါ',
    save: 'သိမ်းမည်', saved: 'သိမ်းပြီးပါပြီ', cancel: 'မလုပ်တော့ပါ', delete: 'ဖျက်မည်', edit: 'ပြင်မည်',
    call: 'ဖုန်းဆက်', sms: 'SMS', line: 'LINE', share: 'ပို့မည်', verify: 'ဖုန်းမှန်ကြောင်း အတည်ပြုမည်',
    verified: 'ဖုန်းစစ်ပြီး', notVerified: 'ဖုန်း မစစ်ရသေး', unverify: 'အတည်ပြုချက် ဖြုတ်မည်',
    verifyHint: 'ဖုန်းဆက်ကြည့်ပြီး ကိုယ်တိုင်ကိုင်မှ အတည်ပြုပါ',
    confirmDelete: 'ဒီလူကို ဖျက်မှာ သေချာလား? ပြန်ယူလို့ မရပါ။', deleted: 'ဖျက်ပြီးပါပြီ',
    discardTitle: 'မသိမ်းရသေးပါ', discardMsg: 'ပြင်ထားတာတွေ ပျောက်သွားမယ်။ ထွက်မှာလား?', leave: 'ထွက်မည်', stay: 'ဆက်ပြင်မည်',
    draftRestored: 'မသိမ်းခဲ့တဲ့ မူကြမ်းကို ပြန်ဖွင့်ထားတယ်', clearDraft: 'ရှင်းမည်',
    newPerson: 'လူသစ် ထည့်ရန်', editPerson: 'အချက်အလက် ပြင်ရန်', history: 'မှတ်တမ်း', changeStatus: 'အခြေအနေ ပြောင်းရန်',
    statusChanged: 'အခြေအနေ ပြောင်းပြီး', callFailed: 'ဒီဖုန်းမှာ ဖုန်းဆက်လို့ မရပါ', lineMissing: 'LINE ID မထည့်ရသေးပါ',
    daysLeft: '{n} ရက်ကျန်', expired: 'သက်တမ်းကုန်ပြီ', created: 'ထည့်သွင်းခဲ့သည်', updated: 'ပြင်ဆင်ခဲ့သည်',
    noData: '—', yes: 'ဟုတ်ကဲ့', no: 'မဟုတ်ပါ', close: 'ပိတ်မည်', ok: 'အိုကေ',
    adminTitle: 'စီမံခန့်ခွဲမှု', enterPin: 'Admin PIN ရိုက်ပါ', wrongPin: 'PIN မှားနေပါတယ်',
    lockedFor: '{n} စက္ကန့် စောင့်ပါ', factoryName: 'စက်ရုံ နာမည်', recruiterName: 'သင့်နာမည်',
    depts: 'ဌာနများ', positions: 'ရာထူးများ', shifts: 'အဆိုင်းများ', addItemPh: 'အသစ်ထည့်ရန်…',
    requiredFields: 'မဖြည့်မနေရ အကွက်များ', requiredHint: 'ဖွင့်ထားတဲ့ အကွက်တွေကို မဖြည့်ရင် သိမ်းလို့မရပါ',
    feeTracking: 'ခေါ်ပေးခ မှတ်မည်', defaultFee: 'ပုံသေ ခေါ်ပေးခ (ဘတ်)', expiryDays: 'သက်တမ်း သတိပေးရက် (ရက်)',
    changePin: 'PIN ပြောင်းမည်', oldPin: 'PIN အဟောင်း', newPin: 'PIN အသစ် (ဂဏန်း ၄ လုံး)', pinChanged: 'PIN ပြောင်းပြီးပါပြီ',
    exportCsv: 'Excel (CSV) အဖြစ် ပို့မည်', backup: 'Backup ထုတ်ပို့မည်', restore: 'Backup ပြန်သွင်းမည်',
    pasteBackup: 'Backup စာသားကို ဒီမှာ Paste လုပ်ပါ', restoreDone: 'ပြန်သွင်းပြီး — {n} ယောက်', invalidBackup: 'Backup စာသား မှားနေပါတယ်',
    wipe: 'ဒေတာ အားလုံးဖျက်မည်', wipeConfirm: 'လူသစ်စာရင်း အားလုံး ပျက်သွားမယ်။ Backup ထုတ်ပြီးပြီလား?', wipeDone: 'အားလုံး ဖျက်ပြီးပါပြီ',
    activity: 'လုပ်ဆောင်ချက် မှတ်တမ်း', lock: 'Admin ပိတ်မည်', language: 'ဘာသာစကား', dataPrivacy: 'ဒေတာ နှင့် လုံခြုံရေး',
    privacyNote: 'ဒေတာ အားလုံး ဒီဖုန်းထဲမှာပဲ သိမ်းထားပါတယ်။ ဖုန်းပျောက်ရင် ပျောက်မှာမို့ Backup ကို မှန်မှန်ထုတ်ပြီး LINE/Drive မှာ သိမ်းထားပါ။',
    settingsSaved: 'ပြောင်းလဲမှု သိမ်းပြီး', stats: 'အချက်အလက် စုစုပေါင်း', saveFailed: 'သိမ်းလို့ မရပါ — ထပ်ကြိုးစားပါ',
    welcome: 'လူသစ်တွေကို စနစ်တကျ မှတ်ထားပါ', obSub: 'ဖုန်းနံပါတ်၊ စာရွက်စာတမ်း၊ အလုပ်ဝင်ရက် — တစ်နေရာထဲမှာ အမှန်ကန်ဆုံး',
    setPin: 'Admin PIN သတ်မှတ်ပါ (ဂဏန်း ၄ လုံး)', pinAgain: 'PIN ထပ်ရိုက်ပါ', pinMismatch: 'PIN နှစ်ခု မတူပါ', pin4: 'ဂဏန်း ၄ လုံး ဖြစ်ရမည်',
    start: 'စတင်မည်', yourNamePh: 'ဥပမာ – ကိုကျော်', factoryPh: 'ဥပမာ – ABC Food Factory',
    log_add: '{name} ကို ထည့်သည်', log_edit: '{name} ကို ပြင်သည်', log_del: '{name} ကို ဖျက်သည်',
    log_status: '{name} → {s}', log_verify: '{name} ဖုန်း အတည်ပြုသည်', log_settings: 'Admin ဆက်တင် ပြောင်းသည်',
    log_restore: 'Backup ပြန်သွင်းသည် ({n})', log_wipe: 'ဒေတာ အားလုံးဖျက်သည်', log_pin: 'PIN ပြောင်းသည်',
    filterAlert: 'သတိပေးချက်ရှိသူ', profileFor: 'လူသစ် အချက်အလက်',
  },
  th: {
    brand: 'คนใหม่', tagline: 'บันทึกพนักงานใหม่',
    home: 'หน้าหลัก', people: 'รายชื่อ', add: 'เพิ่ม', admin: 'แอดมิน',
    hello: 'สวัสดี', total: 'คนใหม่ทั้งหมด', thisMonth: 'เริ่มงานเดือนนี้', working: 'กำลังทำงาน',
    pipeline: 'ตามสถานะ', alerts: 'การแจ้งเตือน',
    expiringDocs: 'เอกสารใกล้หมดอายุ', unverified: 'เบอร์โทรยังไม่ยืนยัน',
    unpaid: 'ค่านายหน้าค้างรับ', recent: 'เพิ่มล่าสุด', seeAll: 'ดูทั้งหมด',
    allGood: 'ไม่มีการแจ้งเตือน — เรียบร้อยดี',
    emptyTitle: 'ยังไม่มีคนใหม่', emptySub: 'กด + ด้านล่างเพื่อเพิ่มคนแรก',
    search: 'ค้นหาชื่อ เบอร์ เลขเอกสาร', all: 'ทั้งหมด', noResults: 'ไม่พบข้อมูล',
    sortNew: 'ล่าสุด', sortName: 'ชื่อ', sortStart: 'วันเริ่มงาน', people_n: '{n} คน',
    st_lead: 'ติดต่อแล้ว', st_interview: 'สัมภาษณ์', st_docs: 'ทำเอกสาร',
    st_started: 'เริ่มงานแล้ว', st_left: 'ลาออก', st_rejected: 'ไม่ผ่าน',
    secPersonal: 'ข้อมูลส่วนตัว', secContact: 'การติดต่อ', secDocs: 'เอกสาร',
    secAddress: 'ที่อยู่', secJob: 'งาน', secEmergency: 'ผู้ติดต่อฉุกเฉิน', secFee: 'ค่านายหน้า & หมายเหตุ',
    nameMm: 'ชื่อ (ภาษาพม่า)', nameEn: 'ชื่อ (อังกฤษ/ตามพาสปอร์ต)', nickname: 'ชื่อเล่น',
    gender: 'เพศ', male: 'ชาย', female: 'หญิง', dob: 'วันเกิด', age: 'อายุ', ageY: '{n} ปี',
    phone: 'เบอร์โทร', phoneConfirm: 'พิมพ์เบอร์โทรอีกครั้ง (ยืนยัน)', phone2: 'เบอร์สำรอง',
    lineId: 'LINE ID', facebook: 'ชื่อ Facebook', thai: 'ไทย', myanmar: 'พม่า',
    docType: 'ประเภทเอกสาร', dt_passport: 'พาสปอร์ต', dt_pink: 'บัตรชมพู', dt_ci: 'CI', dt_other: 'อื่นๆ',
    docNo: 'เลขเอกสาร', docExpiry: 'วันหมดอายุ',
    hometown: 'ภูมิลำเนา (พม่า)', currentAddress: 'ที่อยู่ปัจจุบัน (ไทย)',
    dept: 'แผนก', position: 'ตำแหน่ง', shift: 'กะ', startDate: 'วันเริ่มงาน', status: 'สถานะ',
    emName: 'ชื่อ', emRelation: 'ความสัมพันธ์', emPhone: 'เบอร์โทร',
    fee: 'ค่านายหน้า (บาท)', feePaid: 'รับเงินแล้ว', notes: 'หมายเหตุ',
    datePh: 'วว/ดด/ปปปป', today: 'วันนี้',
    required: 'จำเป็นต้องกรอก', badPhoneTH: 'เบอร์ไทย 10 หลัก ขึ้นต้น 06/08/09',
    badPhoneMM: 'เบอร์พม่าขึ้นต้น 09 จำนวน 9–11 หลัก', phoneMismatch: 'เบอร์ทั้งสองไม่ตรงกัน — กรุณาตรวจสอบ',
    phoneMatch: 'เบอร์ตรงกัน', dupPhone: 'เบอร์นี้มีแล้ว: "{name}"', dupDoc: 'เลขเอกสารนี้มีแล้ว: "{name}"',
    badDate: 'วันที่ไม่ถูกต้อง (วว/ดด/ปปปป)', under18: 'ระวัง — อายุต่ำกว่า 18 ปี', expiredWarn: 'ระวัง — หมดอายุแล้ว',
    fixErrors: 'กรุณาแก้ไขช่องสีแดง', badFee: 'ใส่ตัวเลขเท่านั้น',
    save: 'บันทึก', saved: 'บันทึกแล้ว', cancel: 'ยกเลิก', delete: 'ลบ', edit: 'แก้ไข',
    call: 'โทร', sms: 'SMS', line: 'LINE', share: 'แชร์', verify: 'ยืนยันว่าเบอร์ถูกต้อง',
    verified: 'ยืนยันเบอร์แล้ว', notVerified: 'ยังไม่ยืนยันเบอร์', unverify: 'ยกเลิกการยืนยัน',
    verifyHint: 'โทรหาและให้เจ้าตัวรับสายก่อนยืนยัน',
    confirmDelete: 'ต้องการลบคนนี้ใช่ไหม? กู้คืนไม่ได้', deleted: 'ลบแล้ว',
    discardTitle: 'ยังไม่ได้บันทึก', discardMsg: 'ข้อมูลที่แก้ไขจะหายไป ออกเลยไหม?', leave: 'ออก', stay: 'แก้ไขต่อ',
    draftRestored: 'กู้คืนแบบร่างที่ยังไม่บันทึกแล้ว', clearDraft: 'ล้าง',
    newPerson: 'เพิ่มคนใหม่', editPerson: 'แก้ไขข้อมูล', history: 'ประวัติ', changeStatus: 'เปลี่ยนสถานะ',
    statusChanged: 'เปลี่ยนสถานะแล้ว', callFailed: 'เครื่องนี้โทรออกไม่ได้', lineMissing: 'ยังไม่มี LINE ID',
    daysLeft: 'เหลือ {n} วัน', expired: 'หมดอายุแล้ว', created: 'เพิ่มเมื่อ', updated: 'แก้ไขเมื่อ',
    noData: '—', yes: 'ใช่', no: 'ไม่', close: 'ปิด', ok: 'ตกลง',
    adminTitle: 'การจัดการ', enterPin: 'ใส่ PIN แอดมิน', wrongPin: 'PIN ไม่ถูกต้อง',
    lockedFor: 'รอ {n} วินาที', factoryName: 'ชื่อโรงงาน', recruiterName: 'ชื่อของคุณ',
    depts: 'แผนก', positions: 'ตำแหน่ง', shifts: 'กะทำงาน', addItemPh: 'เพิ่มใหม่…',
    requiredFields: 'ช่องที่ต้องกรอก', requiredHint: 'ช่องที่เปิดไว้ต้องกรอกก่อนบันทึก',
    feeTracking: 'บันทึกค่านายหน้า', defaultFee: 'ค่านายหน้าเริ่มต้น (บาท)', expiryDays: 'แจ้งเตือนก่อนหมดอายุ (วัน)',
    changePin: 'เปลี่ยน PIN', oldPin: 'PIN เดิม', newPin: 'PIN ใหม่ (4 หลัก)', pinChanged: 'เปลี่ยน PIN แล้ว',
    exportCsv: 'ส่งออก Excel (CSV)', backup: 'ส่งออกข้อมูลสำรอง', restore: 'นำเข้าข้อมูลสำรอง',
    pasteBackup: 'วางข้อความสำรองที่นี่', restoreDone: 'นำเข้าแล้ว — {n} คน', invalidBackup: 'ข้อความสำรองไม่ถูกต้อง',
    wipe: 'ลบข้อมูลทั้งหมด', wipeConfirm: 'รายชื่อทั้งหมดจะถูกลบ สำรองข้อมูลแล้วหรือยัง?', wipeDone: 'ลบทั้งหมดแล้ว',
    activity: 'ประวัติการใช้งาน', lock: 'ล็อกแอดมิน', language: 'ภาษา', dataPrivacy: 'ข้อมูลและความปลอดภัย',
    privacyNote: 'ข้อมูลทั้งหมดเก็บในเครื่องนี้เท่านั้น ถ้าเครื่องหายข้อมูลจะหาย กรุณาสำรองข้อมูลเป็นประจำแล้วเก็บไว้ใน LINE/Drive',
    settingsSaved: 'บันทึกการตั้งค่าแล้ว', stats: 'สรุปข้อมูล', saveFailed: 'บันทึกไม่สำเร็จ — ลองอีกครั้ง',
    welcome: 'บันทึกพนักงานใหม่อย่างเป็นระบบ', obSub: 'เบอร์โทร เอกสาร วันเริ่มงาน — ถูกต้องในที่เดียว',
    setPin: 'ตั้ง PIN แอดมิน (4 หลัก)', pinAgain: 'ใส่ PIN อีกครั้ง', pinMismatch: 'PIN ไม่ตรงกัน', pin4: 'ต้องเป็นตัวเลข 4 หลัก',
    start: 'เริ่มใช้งาน', yourNamePh: 'เช่น โก จอ', factoryPh: 'เช่น ABC Food Factory',
    log_add: 'เพิ่ม {name}', log_edit: 'แก้ไข {name}', log_del: 'ลบ {name}',
    log_status: '{name} → {s}', log_verify: 'ยืนยันเบอร์ {name}', log_settings: 'เปลี่ยนการตั้งค่าแอดมิน',
    log_restore: 'นำเข้าข้อมูลสำรอง ({n})', log_wipe: 'ลบข้อมูลทั้งหมด', log_pin: 'เปลี่ยน PIN',
    filterAlert: 'มีการแจ้งเตือน', profileFor: 'ข้อมูลพนักงานใหม่',
  },
  en: {
    brand: 'Newperson', tagline: 'New worker records',
    home: 'Home', people: 'People', add: 'Add', admin: 'Admin',
    hello: 'Hello', total: 'Total new people', thisMonth: 'Started this month', working: 'Currently working',
    pipeline: 'Pipeline', alerts: 'Alerts',
    expiringDocs: 'Documents expiring soon', unverified: 'Phone not verified',
    unpaid: 'Unpaid fees', recent: 'Recently added', seeAll: 'See all',
    allGood: 'No alerts — everything looks good',
    emptyTitle: 'No new people yet', emptySub: 'Tap + below to add the first person',
    search: 'Search name, phone, document no.', all: 'All', noResults: 'No results',
    sortNew: 'Newest', sortName: 'Name', sortStart: 'Start date', people_n: '{n} people',
    st_lead: 'Contacted', st_interview: 'Interview', st_docs: 'Paperwork',
    st_started: 'Started', st_left: 'Left', st_rejected: 'Rejected',
    secPersonal: 'Personal', secContact: 'Contact', secDocs: 'Documents',
    secAddress: 'Address', secJob: 'Job', secEmergency: 'Emergency contact', secFee: 'Fee & notes',
    nameMm: 'Name (Myanmar)', nameEn: 'Name (English / as in passport)', nickname: 'Nickname',
    gender: 'Gender', male: 'Male', female: 'Female', dob: 'Date of birth', age: 'Age', ageY: '{n} yrs',
    phone: 'Phone', phoneConfirm: 'Re-type phone (to check)', phone2: 'Second phone',
    lineId: 'LINE ID', facebook: 'Facebook name', thai: 'Thai', myanmar: 'Myanmar',
    docType: 'Document type', dt_passport: 'Passport', dt_pink: 'Pink card', dt_ci: 'CI', dt_other: 'Other',
    docNo: 'Document no.', docExpiry: 'Expiry date',
    hometown: 'Hometown (Myanmar)', currentAddress: 'Current address (Thailand)',
    dept: 'Department', position: 'Position', shift: 'Shift', startDate: 'Start date', status: 'Status',
    emName: 'Name', emRelation: 'Relation', emPhone: 'Phone',
    fee: 'Fee (THB)', feePaid: 'Paid', notes: 'Notes',
    datePh: 'DD/MM/YYYY', today: 'Today',
    required: 'Required', badPhoneTH: 'Thai mobile: 10 digits starting 06/08/09',
    badPhoneMM: 'Myanmar mobile: starts 09, 9–11 digits', phoneMismatch: "Numbers don't match — please check",
    phoneMatch: 'Numbers match', dupPhone: 'Already used by "{name}"', dupDoc: 'Document already used by "{name}"',
    badDate: 'Invalid date (DD/MM/YYYY)', under18: 'Warning — under 18', expiredWarn: 'Warning — already expired',
    fixErrors: 'Please fix the highlighted fields', badFee: 'Numbers only',
    save: 'Save', saved: 'Saved', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    call: 'Call', sms: 'SMS', line: 'LINE', share: 'Share', verify: 'Mark phone as verified',
    verified: 'Phone verified', notVerified: 'Phone not verified', unverify: 'Remove verification',
    verifyHint: 'Call first and only verify when they answer themselves',
    confirmDelete: 'Delete this person? This cannot be undone.', deleted: 'Deleted',
    discardTitle: 'Not saved', discardMsg: 'Your changes will be lost. Leave anyway?', leave: 'Leave', stay: 'Keep editing',
    draftRestored: 'Restored your unsaved draft', clearDraft: 'Clear',
    newPerson: 'Add new person', editPerson: 'Edit details', history: 'History', changeStatus: 'Change status',
    statusChanged: 'Status changed', callFailed: 'This device cannot make calls', lineMissing: 'No LINE ID yet',
    daysLeft: '{n} days left', expired: 'Expired', created: 'Added', updated: 'Edited',
    noData: '—', yes: 'Yes', no: 'No', close: 'Close', ok: 'OK',
    adminTitle: 'Administration', enterPin: 'Enter admin PIN', wrongPin: 'Wrong PIN',
    lockedFor: 'Wait {n}s', factoryName: 'Factory name', recruiterName: 'Your name',
    depts: 'Departments', positions: 'Positions', shifts: 'Shifts', addItemPh: 'Add new…',
    requiredFields: 'Required fields', requiredHint: 'Switched-on fields must be filled before saving',
    feeTracking: 'Track recruiting fee', defaultFee: 'Default fee (THB)', expiryDays: 'Expiry alert window (days)',
    changePin: 'Change PIN', oldPin: 'Current PIN', newPin: 'New PIN (4 digits)', pinChanged: 'PIN changed',
    exportCsv: 'Export Excel (CSV)', backup: 'Export backup', restore: 'Restore backup',
    pasteBackup: 'Paste backup text here', restoreDone: 'Restored — {n} people', invalidBackup: 'Backup text is not valid',
    wipe: 'Delete all data', wipeConfirm: 'Every record will be deleted. Have you exported a backup?', wipeDone: 'All data deleted',
    activity: 'Activity log', lock: 'Lock admin', language: 'Language', dataPrivacy: 'Data & privacy',
    privacyNote: 'All data is stored only on this phone. If the phone is lost the data is lost — export a backup regularly and keep it in LINE/Drive.',
    settingsSaved: 'Settings saved', stats: 'Totals', saveFailed: 'Could not save — try again',
    welcome: 'Keep every new hire organised', obSub: 'Phone numbers, documents, start dates — accurate, in one place',
    setPin: 'Set admin PIN (4 digits)', pinAgain: 'Re-enter PIN', pinMismatch: "PINs don't match", pin4: 'Must be 4 digits',
    start: 'Get started', yourNamePh: 'e.g. Ko Kyaw', factoryPh: 'e.g. ABC Food Factory',
    log_add: 'Added {name}', log_edit: 'Edited {name}', log_del: 'Deleted {name}',
    log_status: '{name} → {s}', log_verify: 'Verified phone of {name}', log_settings: 'Changed admin settings',
    log_restore: 'Restored backup ({n})', log_wipe: 'Deleted all data', log_pin: 'Changed PIN',
    filterAlert: 'Has alerts', profileFor: 'New hire profile',
  },
};
const LANGS = [{ id: 'my', label: 'မြန်မာ' }, { id: 'th', label: 'ไทย' }, { id: 'en', label: 'EN' }];
function makeT(lang) {
  const dict = T[lang] || T.my;
  return (key, params) => {
    let s = dict[key] != null ? dict[key] : (T.en[key] != null ? T.en[key] : key);
    if (params) Object.keys(params).forEach((p) => { s = s.split('{' + p + '}').join(String(params[p])); });
    return s;
  };
}

/* ───────────────────────── PURE HELPERS (tested) ───────────────────────── */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const digits = (s) => String(s || '').replace(/\D/g, '');

export function normalizePhone(raw) {
  let s = String(raw || '').trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+66')) s = '0' + s.slice(3);
  else if (s.startsWith('+95')) s = '0' + s.slice(3);
  else if (s.startsWith('0066')) s = '0' + s.slice(4);
  else if (s.startsWith('0095')) s = '0' + s.slice(4);
  return digits(s);
}
export function isValidPhone(d, cc) {
  if (cc === 'MM') return /^09\d{7,9}$/.test(d);
  return /^0[689]\d{8}$/.test(d);
}
export function formatPhone(d, cc) {
  if (!d) return '';
  if (cc !== 'MM' && d.length === 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
  if (cc === 'MM' && d.length >= 9) return d.slice(0, 2) + ' ' + d.slice(2, 5) + ' ' + d.slice(5, 8) + (d.length > 8 ? ' ' + d.slice(8) : '');
  return d;
}
export function telUri(d, cc) {
  if (!d) return '';
  return 'tel:' + (cc === 'MM' ? '+95' + d.slice(1) : d);
}
export function maskDate(s) {
  const d = digits(s).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2);
  return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
}
/* Accepts DD/MM/YYYY; Thai Buddhist years (>= 2400) are converted (-543). */
export function parseDate(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || ''));
  if (!m) return null;
  const d = +m[1]; const mo = +m[2]; let y = +m[3];
  if (y >= 2400) y -= 543;
  if (y < 1900 || y > 2100) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}
export function fmtDate(dt) {
  if (!dt) return '';
  const p = (n) => String(n).padStart(2, '0');
  return p(dt.getDate()) + '/' + p(dt.getMonth() + 1) + '/' + dt.getFullYear();
}
export function normalizeDate(s) { const d = parseDate(s); return d ? fmtDate(d) : ''; }
export function fmtDateTime(iso) {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return fmtDate(dt) + ' ' + p(dt.getHours()) + ':' + p(dt.getMinutes());
}
export function ageFrom(dobStr, now = new Date()) {
  const d = parseDate(dobStr);
  if (!d) return null;
  let a = now.getFullYear() - d.getFullYear();
  const md = now.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) a -= 1;
  return a;
}
export function daysUntil(dateStr, now = new Date()) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - a.getTime()) / 86400000);
}
export function hashPin(pin) {
  // Local obfuscation only (FNV-1a). Not real security — data never leaves the phone.
  const s = 'np-salt::' + String(pin);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}
export function displayName(p) { return (p && (p.nameMm || p.nameEn || p.nickname)) || '—'; }

export function findDuplicate(people, selfId, key, value) {
  if (!value) return null;
  return people.find((p) => p.id !== selfId && (
    key === 'phone'
      ? (p.phone === value || p.phone2 === value)
      : String(p.docNo || '').toUpperCase() === String(value).toUpperCase()
  )) || null;
}

/* Returns { field: [messageKey, params] } — empty object means valid. */
export function validatePerson(f, people, settings, originalPhone) {
  const e = {};
  const req = (settings && settings.required) || {};
  const blank = (v) => !String(v == null ? '' : v).trim();
  if (blank(f.nameMm)) e.nameMm = ['required'];
  OPTIONAL_REQUIRED.forEach((k) => { if (req[k] && blank(f[k])) e[k] = ['required']; });

  const ph = normalizePhone(f.phone);
  if (!ph) e.phone = ['required'];
  else if (!isValidPhone(ph, f.phoneCc)) e.phone = [f.phoneCc === 'MM' ? 'badPhoneMM' : 'badPhoneTH'];
  else {
    const dup = findDuplicate(people, f.id, 'phone', ph);
    if (dup) e.phone = ['dupPhone', { name: displayName(dup) }];
  }
  const needConfirm = !originalPhone || normalizePhone(originalPhone) !== ph;
  if (needConfirm && !e.phone) {
    if (!normalizePhone(f.phoneConfirm)) e.phoneConfirm = ['required'];
    else if (normalizePhone(f.phoneConfirm) !== ph) e.phoneConfirm = ['phoneMismatch'];
  }
  const ph2 = normalizePhone(f.phone2);
  if (ph2) {
    if (!isValidPhone(ph2, f.phone2Cc)) e.phone2 = [f.phone2Cc === 'MM' ? 'badPhoneMM' : 'badPhoneTH'];
    else if (ph2 === ph) e.phone2 = ['dupPhone', { name: displayName(f) }];
    else {
      const dup = findDuplicate(people, f.id, 'phone', ph2);
      if (dup) e.phone2 = ['dupPhone', { name: displayName(dup) }];
    }
  }
  const emp = normalizePhone(f.emPhone);
  if (emp && !isValidPhone(emp, f.emPhoneCc)) e.emPhone = [f.emPhoneCc === 'MM' ? 'badPhoneMM' : 'badPhoneTH'];

  if (!blank(f.docNo)) {
    const dup = findDuplicate(people, f.id, 'doc', String(f.docNo).trim());
    if (dup) e.docNo = ['dupDoc', { name: displayName(dup) }];
  }
  ['dob', 'docExpiry', 'startDate'].forEach((k) => {
    if (!blank(f[k]) && !parseDate(f[k])) e[k] = ['badDate'];
  });
  if (!blank(f.fee) && !/^\d+(\.\d{1,2})?$/.test(String(f.fee).trim())) e.fee = ['badFee'];
  return e;
}

export function personAlerts(p, settings, now = new Date()) {
  const out = [];
  const win = Number((settings && settings.expiryDays) || 60);
  if (p.status === 'left' || p.status === 'rejected') return out;
  const dl = daysUntil(p.docExpiry, now);
  if (dl != null && dl <= win) out.push({ type: 'expiry', days: dl });
  if (!p.phoneVerified) out.push({ type: 'phone' });
  if (settings && settings.feeTracking && Number(p.fee) > 0 && !p.feePaid && p.status === 'started') out.push({ type: 'fee' });
  return out;
}

const CSV_COLS = [
  'nameMm', 'nameEn', 'nickname', 'gender', 'dob', 'phone', 'phoneVerified', 'phone2', 'lineId', 'facebook',
  'docType', 'docNo', 'docExpiry', 'hometown', 'currentAddress', 'dept', 'position', 'shift', 'startDate',
  'status', 'emName', 'emRelation', 'emPhone', 'fee', 'feePaid', 'notes', 'createdAt',
];
export function toCsv(people) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = [CSV_COLS.join(',')];
  people.forEach((p) => rows.push(CSV_COLS.map((c) => {
    if (c === 'phone' || c === 'phone2' || c === 'emPhone') return esc(p[c] ? '​' + p[c] : ''); // keep leading 0 in Excel
    return esc(p[c]);
  }).join(',')));
  return '﻿' + rows.join('\r\n');
}

export function mergeBackup(current, incoming) {
  if (!Array.isArray(incoming)) return null;
  const valid = incoming.filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && (p.nameMm || p.nameEn) && p.phone);
  if (!valid.length && incoming.length) return null;
  const map = new Map(current.map((p) => [p.id, p]));
  valid.forEach((p) => {
    const old = map.get(p.id);
    if (!old || String(p.updatedAt || '') >= String(old.updatedAt || '')) map.set(p.id, p);
  });
  return { people: Array.from(map.values()), count: valid.length };
}

const DEFAULT_SETTINGS = {
  onboarded: false, lang: 'my', factoryName: '', recruiterName: '', pinHash: '',
  depts: ['Production', 'Packing', 'QC', 'Warehouse', 'Cleaning'],
  positions: ['Operator', 'Helper', 'Forklift', 'Cleaner', 'Leader'],
  shifts: ['กะ 1 (เช้า)', 'กะ 2 (ดึก)'],
  required: { dob: true, docNo: true, dept: true, startDate: false, emPhone: false },
  feeTracking: true, defaultFee: '', expiryDays: 60,
};
function emptyPerson(settings) {
  return {
    id: '', nameMm: '', nameEn: '', nickname: '', gender: '', dob: '',
    phone: '', phoneCc: 'TH', phoneConfirm: '', phoneVerified: false, phone2: '', phone2Cc: 'TH',
    lineId: '', facebook: '', docType: 'passport', docNo: '', docExpiry: '',
    hometown: '', currentAddress: '', dept: '', position: '', shift: '', startDate: '', status: 'lead',
    emName: '', emRelation: '', emPhone: '', emPhoneCc: 'MM',
    fee: settings && settings.defaultFee ? String(settings.defaultFee) : '', feePaid: false, notes: '',
    history: [],
  };
}

/* ───────────────────────── SMALL UI PRIMITIVES ───────────────────────── */
function Txt({ style, children, ...rest }) {
  return <Text style={[st.txt, style]} {...rest}>{children}</Text>;
}

function Btn({ label, icon, onPress, variant = 'primary', disabled, style, small, a11y }) {
  const v = {
    primary: { bg: C.lime, fg: C.limeInk, bd: C.lime },
    ghost: { bg: 'transparent', fg: C.text, bd: C.line },
    soft: { bg: C.surface2, fg: C.text, bd: C.surface2 },
    danger: { bg: 'transparent', fg: C.red, bd: '#4A2530' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y || label}
      style={({ pressed }) => [
        st.btn, small && st.btnSmall,
        { backgroundColor: v.bg, borderColor: v.bd, opacity: disabled ? 0.45 : pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={v.fg} /> : null}
      {label ? <Txt style={[st.btnTxt, small && { fontSize: F.sm }, { color: v.fg }]} numberOfLines={1}>{label}</Txt> : null}
    </Pressable>
  );
}

function Chip({ label, active, onPress, color = C.lime, icon, count }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        st.chip,
        active && { backgroundColor: color, borderColor: color },
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? C.limeInk : C.sub} style={{ marginRight: 5 }} /> : null}
      <Txt style={[st.chipTxt, active && { color: C.limeInk, fontWeight: '700' }]}>{label}</Txt>
      {count != null ? (
        <View style={[st.chipCount, active && { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
          <Txt style={[st.chipCountTxt, active && { color: C.limeInk }]}>{count}</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

function StatusPill({ status, t, big }) {
  const col = STATUS_COLOR[status] || C.faint;
  return (
    <View style={[st.pill, { borderColor: col + '66', backgroundColor: col + '1F' }, big && { paddingVertical: 6, paddingHorizontal: 12 }]}>
      <View style={[st.pillDot, { backgroundColor: col }]} />
      <Txt style={[st.pillTxt, { color: col }, big && { fontSize: F.sm }]}>{t('st_' + status)}</Txt>
    </View>
  );
}

function Avatar({ name, size = 46 }) {
  const n = String(name || '?').trim();
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  const col = AVATAR_COLORS[h % AVATAR_COLORS.length];
  const letters = Array.from(n).slice(0, 1).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: col, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}>
      <Text style={{ color: C.limeInk, fontWeight: '900', fontSize: size * 0.42, lineHeight: size * 0.62 }}>{letters}</Text>
    </View>
  );
}

function SectionTitle({ title, right, icon }) {
  return (
    <View style={st.secTitleRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {icon ? <Ionicons name={icon} size={16} color={C.lime} style={{ marginRight: 8 }} /> : null}
        <Txt style={st.secTitle}>{title}</Txt>
      </View>
      {right}
    </View>
  );
}

function FadeIn({ children, delay = 0, style, reduce }) {
  const a = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(a, { toValue: 1, duration: DUR.base, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function Field({ label, value, onChangeText, error, errorText, hint, hintColor, required, keyboardType, placeholder, multiline, maxLength, onLayout, autoCapitalize, right, secure, editable = true }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={st.field} onLayout={onLayout}>
      {label ? <Txt style={st.label}>{label}{required ? <Txt style={{ color: C.coral }}> *</Txt> : null}</Txt> : null}
      <View style={[st.inputWrap, focus && { borderColor: C.lime }, error && { borderColor: C.red }, !editable && { opacity: 0.5 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          secureTextEntry={secure}
          editable={editable}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[st.input, multiline && { minHeight: 86, textAlignVertical: 'top', paddingTop: 12 }]}
          accessibilityLabel={label}
        />
        {right}
      </View>
      {error ? (
        <View style={st.msgRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={14} color={C.red} />
          <Txt style={[st.msg, { color: C.red }]}>{errorText}</Txt>
        </View>
      ) : hint ? (
        <View style={st.msgRow}>
          <Txt style={[st.msg, { color: hintColor || C.sub }]}>{hint}</Txt>
        </View>
      ) : null}
    </View>
  );
}

function Card({ children, style }) { return <View style={[st.card, style]}>{children}</View>; }

function Toast({ toast }) {
  const a = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    a.setValue(0);
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: DUR.fast, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(a, { toValue: 0, duration: DUR.base, useNativeDriver: true }),
    ]).start(() => setShown(null));
  }, [toast]);
  if (!shown) return null;
  const col = shown.kind === 'error' ? C.red : shown.kind === 'warn' ? C.amber : C.lime;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[st.toast, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}
    >
      <View style={[st.toastDot, { backgroundColor: col }]}>
        <Ionicons name={shown.kind === 'error' ? 'close' : shown.kind === 'warn' ? 'alert' : 'checkmark'} size={14} color={C.limeInk} />
      </View>
      <Txt style={{ color: C.text, flex: 1, fontSize: F.md }}>{shown.text}</Txt>
    </Animated.View>
  );
}

function PhoneCcToggle({ value, onChange, t }) {
  return (
    <View style={st.ccToggle}>
      {['TH', 'MM'].map((cc) => (
        <Pressable key={cc} onPress={() => onChange(cc)} style={[st.ccBtn, value === cc && { backgroundColor: C.lime }]} accessibilityRole="button" accessibilityState={{ selected: value === cc }}>
          <Txt style={[st.ccTxt, value === cc && { color: C.limeInk }]}>{cc === 'TH' ? '🇹🇭 ' + t('thai') : '🇲🇲 ' + t('myanmar')}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

/* ───────────────────────── PERSON TICKET (list item) ───────────────────────── */
function PersonTicket({ p, t, settings, onPress }) {
  const col = STATUS_COLOR[p.status] || C.faint;
  const alerts = personAlerts(p, settings);
  const age = ageFrom(p.dob);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={displayName(p)} style={({ pressed }) => [st.ticket, pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 }]}>
      <View style={[st.ticketStripe, { backgroundColor: col }]} />
      <View style={{ flex: 1, padding: SP.md, paddingLeft: SP.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={displayName(p)} size={44} />
          <View style={{ flex: 1, marginLeft: SP.md }}>
            <Txt style={st.ticketName} numberOfLines={1}>{displayName(p)}</Txt>
            <Txt style={st.ticketSub} numberOfLines={1}>
              {[p.nameEn, age != null ? t('ageY', { n: age }) : null, p.dept].filter(Boolean).join(' · ') || t('noData')}
            </Txt>
          </View>
          <StatusPill status={p.status} t={t} />
        </View>
        <View style={st.ticketDivider}>
          <View style={[st.notch, { left: -SP.lg - 6 - 9 }]} />
          <View style={st.dash} />
          <View style={[st.notch, { right: -SP.md - 9 }]} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={p.phoneVerified ? 'shield-checkmark' : 'call-outline'} size={14} color={p.phoneVerified ? C.green : C.sub} />
          <Txt style={st.ticketPhone}>{formatPhone(p.phone, p.phoneCc)}</Txt>
          <View style={{ flex: 1 }} />
          {alerts.map((a, i) => (
            <View key={i} style={[st.alertDot, { backgroundColor: a.type === 'expiry' ? C.coral : a.type === 'fee' ? C.amber : C.sky }]}>
              <Ionicons name={a.type === 'expiry' ? 'time' : a.type === 'fee' ? 'cash' : 'call'} size={11} color={C.limeInk} />
            </View>
          ))}
          {p.startDate ? <Txt style={st.ticketDate}>{p.startDate}</Txt> : null}
        </View>
      </View>
    </Pressable>
  );
}

/* ───────────────────────── HOME ───────────────────────── */
function HomeScreen({ people, settings, t, go, reduce }) {
  const now = new Date();
  const counts = useMemo(() => {
    const c = {}; STATUSES.forEach((s) => { c[s] = 0; });
    people.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [people]);
  const startedThisMonth = useMemo(() => people.filter((p) => {
    const d = parseDate(p.startDate);
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && p.status !== 'rejected';
  }).length, [people]);
  const expiring = people.filter((p) => personAlerts(p, settings).some((a) => a.type === 'expiry'));
  const unverified = people.filter((p) => personAlerts(p, settings).some((a) => a.type === 'phone'));
  const unpaidList = people.filter((p) => personAlerts(p, settings).some((a) => a.type === 'fee'));
  const unpaidSum = unpaidList.reduce((s, p) => s + (Number(p.fee) || 0), 0);
  const recent = [...people].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 4);
  const total = people.length || 1;

  return (
    <ScrollView contentContainerStyle={st.screenPad} showsVerticalScrollIndicator={false}>
      <FadeIn reduce={reduce}>
        <View style={st.homeHead}>
          <View style={{ flex: 1 }}>
            <Txt style={st.hello}>{t('hello')}{settings.recruiterName ? ', ' + settings.recruiterName : ''} 👋</Txt>
            <Txt style={st.factory} numberOfLines={2}>{settings.factoryName || t('brand')}</Txt>
          </View>
          <View style={st.logoMark}><Ionicons name="person-add" size={22} color={C.limeInk} /></View>
        </View>
      </FadeIn>

      <FadeIn delay={60} reduce={reduce}>
        <View style={st.hero}>
          <View style={st.heroBlob} />
          <Txt style={st.heroLabel}>{t('total')}</Txt>
          <Txt style={st.heroNum}>{people.length}</Txt>
          <View style={st.heroRow}>
            <View style={st.heroStat}>
              <Txt style={st.heroStatNum}>{startedThisMonth}</Txt>
              <Txt style={st.heroStatLbl}>{t('thisMonth')}</Txt>
            </View>
            <View style={st.heroSep} />
            <View style={st.heroStat}>
              <Txt style={st.heroStatNum}>{counts.started}</Txt>
              <Txt style={st.heroStatLbl}>{t('working')}</Txt>
            </View>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={120} reduce={reduce}>
        <SectionTitle title={t('pipeline')} icon="git-commit-outline" />
        <Card>
          <View style={st.stackBar}>
            {people.length === 0 ? <View style={{ flex: 1, backgroundColor: C.surface2 }} /> :
              STATUSES.filter((s) => counts[s] > 0).map((s) => (
                <View key={s} style={{ flex: counts[s] / total, backgroundColor: STATUS_COLOR[s] }} />
              ))}
          </View>
          <View style={st.legendWrap}>
            {STATUSES.map((s) => (
              <Pressable key={s} style={st.legendItem} onPress={() => go('list', { status: s })} accessibilityRole="button">
                <View style={[st.pillDot, { backgroundColor: STATUS_COLOR[s] }]} />
                <Txt style={st.legendTxt} numberOfLines={1}>{t('st_' + s)}</Txt>
                <Txt style={st.legendNum}>{counts[s]}</Txt>
              </Pressable>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={180} reduce={reduce}>
        <SectionTitle title={t('alerts')} icon="notifications-outline" />
        {expiring.length + unverified.length + unpaidList.length === 0 ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles" size={18} color={C.green} />
            <Txt style={{ color: C.sub, marginLeft: SP.sm, flex: 1 }}>{t('allGood')}</Txt>
          </Card>
        ) : (
          <View style={{ gap: SP.sm }}>
            {expiring.length > 0 && (
              <AlertRow color={C.coral} icon="time" title={t('expiringDocs')} count={expiring.length}
                sub={expiring.slice(0, 3).map((p) => displayName(p)).join(', ')} onPress={() => go('list', { alert: 'expiry' })} />
            )}
            {unverified.length > 0 && (
              <AlertRow color={C.sky} icon="call" title={t('unverified')} count={unverified.length}
                sub={unverified.slice(0, 3).map((p) => displayName(p)).join(', ')} onPress={() => go('list', { alert: 'phone' })} />
            )}
            {settings.feeTracking && unpaidList.length > 0 && (
              <AlertRow color={C.amber} icon="cash" title={t('unpaid')} count={'฿' + unpaidSum.toLocaleString()}
                sub={unpaidList.slice(0, 3).map((p) => displayName(p)).join(', ')} onPress={() => go('list', { alert: 'fee' })} />
            )}
          </View>
        )}
      </FadeIn>

      <FadeIn delay={240} reduce={reduce}>
        <SectionTitle title={t('recent')} icon="flash-outline"
          right={people.length > 0 ? <Pressable onPress={() => go('list', {})} hitSlop={10}><Txt style={{ color: C.lime, fontWeight: '700' }}>{t('seeAll')} →</Txt></Pressable> : null} />
        {recent.length === 0 ? (
          <EmptyState t={t} onAdd={() => go('form', {})} />
        ) : (
          <View style={{ gap: SP.md }}>
            {recent.map((p) => <PersonTicket key={p.id} p={p} t={t} settings={settings} onPress={() => go('detail', { id: p.id })} />)}
          </View>
        )}
      </FadeIn>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function AlertRow({ color, icon, title, count, sub, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.alertRow, { borderLeftColor: color }, pressed && { opacity: 0.8 }]}>
      <View style={[st.alertIcon, { backgroundColor: color + '26' }]}><Ionicons name={icon} size={18} color={color} /></View>
      <View style={{ flex: 1, marginLeft: SP.md }}>
        <Txt style={{ color: C.text, fontWeight: '700', fontSize: F.md }} numberOfLines={1}>{title}</Txt>
        <Txt style={{ color: C.sub, fontSize: F.sm }} numberOfLines={1}>{sub}</Txt>
      </View>
      <Txt style={{ color, fontWeight: '900', fontSize: F.lg, marginLeft: SP.sm }}>{count}</Txt>
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </Pressable>
  );
}

function EmptyState({ t, onAdd, title, sub, icon = 'people-outline' }) {
  return (
    <View style={st.empty}>
      <View style={st.emptyIcon}><Ionicons name={icon} size={34} color={C.lime} /></View>
      <Txt style={st.emptyTitle}>{title || t('emptyTitle')}</Txt>
      <Txt style={st.emptySub}>{sub || t('emptySub')}</Txt>
      {onAdd ? <Btn label={t('newPerson')} icon="add" onPress={onAdd} style={{ marginTop: SP.lg }} /> : null}
    </View>
  );
}

/* ───────────────────────── LIST ───────────────────────── */
function ListScreen({ people, settings, t, go, params }) {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [status, setStatus] = useState(params.status || 'all');
  const [alertF, setAlertF] = useState(params.alert || null);
  const [sort, setSort] = useState('new');
  useEffect(() => { setStatus(params.status || 'all'); setAlertF(params.alert || null); }, [params]);
  useEffect(() => { const h = setTimeout(() => setDq(q.trim().toLowerCase()), 220); return () => clearTimeout(h); }, [q]);

  const counts = useMemo(() => {
    const c = { all: people.length }; STATUSES.forEach((s) => { c[s] = 0; });
    people.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [people]);

  const data = useMemo(() => {
    const qd = digits(dq);
    let arr = people.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (alertF && !personAlerts(p, settings).some((a) => a.type === alertF)) return false;
      if (!dq) return true;
      const hay = [p.nameMm, p.nameEn, p.nickname, p.docNo, p.lineId, p.dept, p.position].join(' ').toLowerCase();
      if (hay.includes(dq)) return true;
      return qd.length >= 3 && ((p.phone || '').includes(qd) || (p.phone2 || '').includes(qd));
    });
    const by = {
      new: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      name: (a, b) => displayName(a).localeCompare(displayName(b)),
      start: (a, b) => ((parseDate(b.startDate) || 0) - (parseDate(a.startDate) || 0)),
    }[sort];
    return arr.sort(by);
  }, [people, dq, status, alertF, sort, settings]);

  const header = (
    <View>
      <Txt style={st.screenTitle}>{t('people')}</Txt>
      <View style={st.searchBox}>
        <Ionicons name="search" size={18} color={C.sub} />
        <TextInput value={q} onChangeText={setQ} placeholder={t('search')} placeholderTextColor={C.faint}
          style={st.searchInput} autoCorrect={false} accessibilityLabel={t('search')} returnKeyType="search" />
        {q ? <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="clear"><Ionicons name="close-circle" size={18} color={C.sub} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.sm, paddingVertical: SP.sm }}>
        <Chip label={t('all')} active={status === 'all'} onPress={() => setStatus('all')} count={counts.all} />
        {STATUSES.map((s) => (
          <Chip key={s} label={t('st_' + s)} active={status === s} color={STATUS_COLOR[s]} onPress={() => setStatus(s)} count={counts[s]} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.md, flexWrap: 'wrap', gap: SP.sm }}>
        {alertF ? (
          <Pressable onPress={() => setAlertF(null)} style={[st.chip, { borderColor: C.coral }]}>
            <Ionicons name="funnel" size={13} color={C.coral} />
            <Txt style={[st.chipTxt, { color: C.coral, marginLeft: 5 }]}>{t(alertF === 'expiry' ? 'expiringDocs' : alertF === 'fee' ? 'unpaid' : 'unverified')}</Txt>
            <Ionicons name="close" size={14} color={C.coral} style={{ marginLeft: 4 }} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }} />
        {['new', 'name', 'start'].map((s) => (
          <Pressable key={s} onPress={() => setSort(s)} hitSlop={6} accessibilityRole="button" accessibilityState={{ selected: sort === s }}>
            <Txt style={[st.sortTxt, sort === s && { color: C.lime, textDecorationLine: 'underline' }]}>{t(s === 'new' ? 'sortNew' : s === 'name' ? 'sortName' : 'sortStart')}</Txt>
          </Pressable>
        ))}
      </View>
      <Txt style={{ color: C.faint, fontSize: F.xs, marginBottom: SP.sm, letterSpacing: 1 }}>{t('people_n', { n: data.length }).toUpperCase()}</Txt>
    </View>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      contentContainerStyle={st.screenPad}
      ItemSeparatorComponent={() => <View style={{ height: SP.md }} />}
      renderItem={({ item }) => <PersonTicket p={item} t={t} settings={settings} onPress={() => go('detail', { id: item.id })} />}
      ListEmptyComponent={people.length === 0
        ? <EmptyState t={t} onAdd={() => go('form', {})} />
        : <EmptyState t={t} icon="search-outline" title={t('noResults')} sub={q ? '"' + q + '"' : ' '} />}
      ListFooterComponent={<View style={{ height: 120 }} />}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      windowSize={9}
      removeClippedSubviews
    />
  );
}

/* ───────────────────────── FORM ───────────────────────── */
function PersonForm({ initial, people, settings, t, onSave, onCancel, guardRef, notify }) {
  const isNew = !initial;
  const [f, setF] = useState(() => (initial ? { ...emptyPerson(settings), ...initial, phoneConfirm: '' } : emptyPerson(settings)));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [draftBanner, setDraftBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const ys = useRef({});
  const secY = useRef({});

  useEffect(() => {
    if (!isNew) return;
    AsyncStorage.getItem(K.draft).then((s) => {
      if (!s) return;
      try {
        const d = JSON.parse(s);
        if (d && typeof d === 'object' && (d.nameMm || d.phone || d.nameEn)) { setF((prev) => ({ ...prev, ...d, id: '' })); setDraftBanner(true); setDirty(true); }
      } catch (e) { /* ignore broken draft */ }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew || !dirty) return undefined;
    const h = setTimeout(() => { AsyncStorage.setItem(K.draft, JSON.stringify(f)).catch(() => {}); }, 500);
    return () => clearTimeout(h);
  }, [f, dirty]);

  useEffect(() => {
    guardRef.current = () => {
      if (!dirty) return false;
      Alert.alert(t('discardTitle'), t('discardMsg'), [
        { text: t('stay'), style: 'cancel' },
        { text: t('leave'), style: 'destructive', onPress: () => { if (isNew) AsyncStorage.removeItem(K.draft).catch(() => {}); onCancel(); } },
      ]);
      return true;
    };
    return () => { guardRef.current = null; };
  }, [dirty, t]);

  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setDirty(true);
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };
  const req = (k) => !!(settings.required && settings.required[k]);
  const err = (k) => (errors[k] ? t(errors[k][0], errors[k][1]) : '');
  const lay = (k) => (e) => { ys.current[k] = e.nativeEvent.layout.y; };
  const secLay = (name) => (e) => { secY.current[name] = e.nativeEvent.layout.y; };

  const ph = normalizePhone(f.phone);
  const phOk = ph && isValidPhone(ph, f.phoneCc);
  const phDup = phOk ? findDuplicate(people, f.id, 'phone', ph) : null;
  const needConfirm = isNew || normalizePhone(initial && initial.phone) !== ph;
  const confirmOk = needConfirm && phOk && normalizePhone(f.phoneConfirm) === ph;
  const docTrim = String(f.docNo || '').trim();
  const docDup = docTrim ? findDuplicate(people, f.id, 'doc', docTrim) : null;
  const age = ageFrom(f.dob);
  const expDays = daysUntil(f.docExpiry);

  const FIELD_SECTION = {
    nameMm: 'p', nameEn: 'p', gender: 'p', dob: 'p', phone: 'c', phoneConfirm: 'c', phone2: 'c',
    docNo: 'd', docExpiry: 'd', hometown: 'a', currentAddress: 'a', dept: 'j', position: 'j', shift: 'j', startDate: 'j',
    emName: 'e', emPhone: 'e', fee: 'f',
  };

  const submit = async () => {
    if (saving) return;
    Keyboard.dismiss();
    const e = validatePerson(f, people, settings, initial && initial.phone);
    setErrors(e);
    const keys = Object.keys(e);
    if (keys.length) {
      notify(t('fixErrors'), 'error');
      const first = keys.map((k) => (secY.current[FIELD_SECTION[k]] || 0) + (ys.current[k] || 0))
        .reduce((m, y) => Math.min(m, y), Infinity);
      if (scrollRef.current && isFinite(first)) scrollRef.current.scrollTo({ y: Math.max(0, first - 20), animated: true });
      return;
    }
    setSaving(true);
    const nowIso = new Date().toISOString();
    const trimmed = {};
    Object.keys(f).forEach((k) => { trimmed[k] = typeof f[k] === 'string' ? f[k].trim() : f[k]; });
    const phoneChanged = !isNew && normalizePhone(initial.phone) !== ph;
    const rec = {
      ...trimmed,
      id: isNew ? uid() : initial.id,
      phone: ph,
      phone2: normalizePhone(f.phone2),
      emPhone: normalizePhone(f.emPhone),
      dob: normalizeDate(f.dob), docExpiry: normalizeDate(f.docExpiry), startDate: normalizeDate(f.startDate),
      docNo: String(trimmed.docNo || '').toUpperCase(),
      phoneVerified: isNew || phoneChanged ? false : !!initial.phoneVerified,
      createdAt: isNew ? nowIso : initial.createdAt,
      updatedAt: nowIso,
      history: isNew
        ? [{ status: f.status, at: nowIso }]
        : (initial.status !== f.status ? [...(initial.history || []), { status: f.status, at: nowIso }] : (initial.history || [])),
    };
    if (rec.status === 'started' && !rec.startDate) rec.startDate = fmtDate(new Date());
    delete rec.phoneConfirm;
    const ok = await onSave(rec, isNew);
    setSaving(false);
    if (ok) {
      setDirty(false);
      if (isNew) AsyncStorage.removeItem(K.draft).catch(() => {});
    }
  };

  const dateField = (k, label, extraHint, hintColor) => (
    <Field label={label} value={f[k]} onChangeText={(v) => set(k, maskDate(v))} keyboardType="number-pad" maxLength={10}
      placeholder={t('datePh')} error={!!errors[k]} errorText={err(k)} required={req(k)} onLayout={lay(k)}
      hint={extraHint} hintColor={hintColor}
      right={<Pressable onPress={() => set(k, fmtDate(new Date()))} hitSlop={8} style={st.inlineBtn} accessibilityLabel={t('today')}><Txt style={st.inlineBtnTxt}>{t('today')}</Txt></Pressable>} />
  );
  const chipsField = (k, label, options, labelFn) => (
    <View style={st.field} onLayout={lay(k)}>
      <Txt style={st.label}>{label}{req(k) ? <Txt style={{ color: C.coral }}> *</Txt> : null}</Txt>
      <View style={st.chipWrap}>
        {options.map((o) => <Chip key={o} label={labelFn ? labelFn(o) : o} active={f[k] === o} onPress={() => set(k, f[k] === o ? '' : o)} />)}
      </View>
      {errors[k] ? <View style={st.msgRow}><Ionicons name="alert-circle" size={14} color={C.red} /><Txt style={[st.msg, { color: C.red }]}>{err(k)}</Txt></View> : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.formHead}>
        <Pressable onPress={() => { if (!(guardRef.current && guardRef.current())) onCancel(); }} hitSlop={10} style={st.iconBtn} accessibilityLabel={t('cancel')}>
          <Ionicons name="close" size={22} color={C.text} />
        </Pressable>
        <Txt style={st.formTitle} numberOfLines={1}>{isNew ? t('newPerson') : t('editPerson')}</Txt>
        <Btn label={t('save')} icon="checkmark" onPress={submit} small disabled={saving} />
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={st.screenPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {draftBanner ? (
          <View style={st.banner}>
            <Ionicons name="document-text" size={16} color={C.amber} />
            <Txt style={{ color: C.text, flex: 1, marginHorizontal: SP.sm, fontSize: F.sm }}>{t('draftRestored')}</Txt>
            <Pressable onPress={() => { setF(emptyPerson(settings)); setDraftBanner(false); setDirty(false); setErrors({}); AsyncStorage.removeItem(K.draft).catch(() => {}); }} hitSlop={8}>
              <Txt style={{ color: C.amber, fontWeight: '700' }}>{t('clearDraft')}</Txt>
            </Pressable>
          </View>
        ) : null}

        <View onLayout={secLay('p')}>
          <SectionTitle title={t('secPersonal')} icon="person-outline" />
          <Card>
            <Field label={t('nameMm')} value={f.nameMm} onChangeText={(v) => set('nameMm', v)} required error={!!errors.nameMm} errorText={err('nameMm')} onLayout={lay('nameMm')} autoCapitalize="words" />
            <Field label={t('nameEn')} value={f.nameEn} onChangeText={(v) => set('nameEn', v)} required={req('nameEn')} error={!!errors.nameEn} errorText={err('nameEn')} onLayout={lay('nameEn')} autoCapitalize="characters" />
            <Field label={t('nickname')} value={f.nickname} onChangeText={(v) => set('nickname', v)} />
            {chipsField('gender', t('gender'), ['male', 'female'], (o) => t(o))}
            {dateField('dob', t('dob'), age != null ? (age < 18 ? t('under18') : t('age') + ': ' + t('ageY', { n: age })) : null, age != null && age < 18 ? C.amber : C.green)}
          </Card>
        </View>

        <View onLayout={secLay('c')}>
          <SectionTitle title={t('secContact')} icon="call-outline" />
          <Card>
            <View onLayout={lay('phone')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm }}>
                <Txt style={st.label}>{t('phone')}<Txt style={{ color: C.coral }}> *</Txt></Txt>
                <PhoneCcToggle value={f.phoneCc} onChange={(v) => set('phoneCc', v)} t={t} />
              </View>
              <Field label="" value={f.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={16}
                placeholder={f.phoneCc === 'MM' ? '09 xxx xxx xxx' : '08x-xxx-xxxx'}
                error={!!errors.phone} errorText={err('phone')}
                hint={phDup ? t('dupPhone', { name: displayName(phDup) }) : phOk ? formatPhone(ph, f.phoneCc) + '  ✓' : ph ? ph.length + ' / ' + (f.phoneCc === 'MM' ? '9–11' : '10') : null}
                hintColor={phDup ? C.red : phOk ? C.green : C.sub}
                right={phOk && !phDup ? <Ionicons name="checkmark-circle" size={20} color={C.green} style={{ marginRight: 10 }} /> : null} />
            </View>
            {needConfirm ? (
              <Field label={t('phoneConfirm')} value={f.phoneConfirm} onChangeText={(v) => set('phoneConfirm', v)} keyboardType="phone-pad" maxLength={16}
                required error={!!errors.phoneConfirm} errorText={err('phoneConfirm')} onLayout={lay('phoneConfirm')}
                hint={f.phoneConfirm ? (confirmOk ? t('phoneMatch') + ' ✓' : t('phoneMismatch')) : null}
                hintColor={confirmOk ? C.green : C.amber}
                right={confirmOk ? <Ionicons name="shield-checkmark" size={20} color={C.green} style={{ marginRight: 10 }} /> : null} />
            ) : null}
            <View onLayout={lay('phone2')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm }}>
                <Txt style={st.label}>{t('phone2')}</Txt>
                <PhoneCcToggle value={f.phone2Cc} onChange={(v) => set('phone2Cc', v)} t={t} />
              </View>
              <Field label="" value={f.phone2} onChangeText={(v) => set('phone2', v)} keyboardType="phone-pad" maxLength={16} error={!!errors.phone2} errorText={err('phone2')} />
            </View>
            <Field label={t('lineId')} value={f.lineId} onChangeText={(v) => set('lineId', v)} />
            <Field label={t('facebook')} value={f.facebook} onChangeText={(v) => set('facebook', v)} autoCapitalize="words" />
          </Card>
        </View>

        <View onLayout={secLay('d')}>
          <SectionTitle title={t('secDocs')} icon="card-outline" />
          <Card>
            <View style={st.field}>
              <Txt style={st.label}>{t('docType')}</Txt>
              <View style={st.chipWrap}>
                {DOC_TYPES.map((d) => <Chip key={d} label={t('dt_' + d)} active={f.docType === d} onPress={() => set('docType', d)} />)}
              </View>
            </View>
            <Field label={t('docNo')} value={f.docNo} onChangeText={(v) => set('docNo', v)} autoCapitalize="characters"
              required={req('docNo')} error={!!errors.docNo} errorText={err('docNo')} onLayout={lay('docNo')}
              hint={docDup ? t('dupDoc', { name: displayName(docDup) }) : null} hintColor={C.red} />
            {dateField('docExpiry', t('docExpiry'),
              expDays != null ? (expDays < 0 ? t('expiredWarn') : t('daysLeft', { n: expDays })) : null,
              expDays != null && expDays <= (settings.expiryDays || 60) ? C.coral : C.green)}
          </Card>
        </View>

        <View onLayout={secLay('a')}>
          <SectionTitle title={t('secAddress')} icon="home-outline" />
          <Card>
            <Field label={t('hometown')} value={f.hometown} onChangeText={(v) => set('hometown', v)} required={req('hometown')} error={!!errors.hometown} errorText={err('hometown')} onLayout={lay('hometown')} />
            <Field label={t('currentAddress')} value={f.currentAddress} onChangeText={(v) => set('currentAddress', v)} multiline required={req('currentAddress')} error={!!errors.currentAddress} errorText={err('currentAddress')} onLayout={lay('currentAddress')} />
          </Card>
        </View>

        <View onLayout={secLay('j')}>
          <SectionTitle title={t('secJob')} icon="briefcase-outline" />
          <Card>
            {chipsField('dept', t('dept'), settings.depts || [])}
            {chipsField('position', t('position'), settings.positions || [])}
            {chipsField('shift', t('shift'), settings.shifts || [])}
            {dateField('startDate', t('startDate'))}
            <View style={st.field}>
              <Txt style={st.label}>{t('status')}</Txt>
              <View style={st.chipWrap}>
                {STATUSES.map((s) => <Chip key={s} label={t('st_' + s)} icon={STATUS_ICON[s]} color={STATUS_COLOR[s]} active={f.status === s} onPress={() => set('status', s)} />)}
              </View>
            </View>
          </Card>
        </View>

        <View onLayout={secLay('e')}>
          <SectionTitle title={t('secEmergency')} icon="medkit-outline" />
          <Card>
            <Field label={t('emName')} value={f.emName} onChangeText={(v) => set('emName', v)} required={req('emName')} error={!!errors.emName} errorText={err('emName')} onLayout={lay('emName')} />
            <Field label={t('emRelation')} value={f.emRelation} onChangeText={(v) => set('emRelation', v)} />
            <View onLayout={lay('emPhone')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm }}>
                <Txt style={st.label}>{t('emPhone')}{req('emPhone') ? <Txt style={{ color: C.coral }}> *</Txt> : null}</Txt>
                <PhoneCcToggle value={f.emPhoneCc} onChange={(v) => set('emPhoneCc', v)} t={t} />
              </View>
              <Field label="" value={f.emPhone} onChangeText={(v) => set('emPhone', v)} keyboardType="phone-pad" maxLength={16} error={!!errors.emPhone} errorText={err('emPhone')} />
            </View>
          </Card>
        </View>

        <View onLayout={secLay('f')}>
          <SectionTitle title={t('secFee')} icon="wallet-outline" />
          <Card>
            {settings.feeTracking ? (
              <>
                <Field label={t('fee')} value={String(f.fee || '')} onChangeText={(v) => set('fee', v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" error={!!errors.fee} errorText={err('fee')} onLayout={lay('fee')} />
                <View style={st.switchRow}>
                  <Txt style={{ color: C.text, flex: 1 }}>{t('feePaid')}</Txt>
                  <Switch value={!!f.feePaid} onValueChange={(v) => set('feePaid', v)} trackColor={{ true: C.green, false: C.line }} thumbColor={C.text} />
                </View>
              </>
            ) : null}
            <Field label={t('notes')} value={f.notes} onChangeText={(v) => set('notes', v)} multiline />
          </Card>
        </View>

        <Btn label={t('save')} icon="checkmark-circle" onPress={submit} disabled={saving} style={{ marginTop: SP.xl }} />
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

/* ───────────────────────── DETAIL ───────────────────────── */
function DetailScreen({ person: p, settings, t, back, onEdit, onDelete, onPatch, notify }) {
  if (!p) {
    return (
      <View style={{ flex: 1 }}>
        <View style={st.formHead}>
          <Pressable onPress={back} style={st.iconBtn}><Ionicons name="arrow-back" size={22} color={C.text} /></Pressable>
        </View>
        <EmptyState t={t} icon="alert-circle-outline" title={t('noResults')} sub=" " />
      </View>
    );
  }
  const age = ageFrom(p.dob);
  const exp = daysUntil(p.docExpiry);
  const open = async (url, failKey) => {
    // canOpenURL() returns false for tel:/sms: on Android 11+ without manifest <queries>,
    // so open directly and only report failure if it really fails.
    try { await Linking.openURL(url); } catch (e) { notify(t(failKey || 'callFailed'), 'error'); }
  };
  const shareProfile = () => {
    const L = (k, v) => (v ? t(k) + ': ' + v : null);
    const msg = [
      '🆕 ' + t('profileFor') + (settings.factoryName ? ' — ' + settings.factoryName : ''),
      L('nameMm', p.nameMm), L('nameEn', p.nameEn), L('nickname', p.nickname),
      L('gender', p.gender ? t(p.gender) : ''), L('dob', p.dob + (age != null ? ' (' + t('ageY', { n: age }) + ')' : '')),
      L('phone', formatPhone(p.phone, p.phoneCc) + (p.phoneVerified ? ' ✓' : '')), L('phone2', formatPhone(p.phone2, p.phone2Cc)),
      L('lineId', p.lineId), L('docType', p.docNo ? t('dt_' + p.docType) : ''), L('docNo', p.docNo), L('docExpiry', p.docExpiry),
      L('hometown', p.hometown), L('currentAddress', p.currentAddress),
      L('dept', p.dept), L('position', p.position), L('shift', p.shift), L('startDate', p.startDate),
      L('status', t('st_' + p.status)),
      p.emName || p.emPhone ? t('secEmergency') + ': ' + [p.emName, p.emRelation, formatPhone(p.emPhone, p.emPhoneCc)].filter(Boolean).join(' · ') : null,
    ].filter(Boolean).join('\n');
    Share.share({ message: msg }).catch(() => {});
  };
  const confirmVerify = () => {
    if (p.phoneVerified) { onPatch({ phoneVerified: false }, 'unverify'); return; }
    Alert.alert(t('verify'), t('verifyHint') + '\n\n' + formatPhone(p.phone, p.phoneCc), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('call'), onPress: () => open(telUri(p.phone, p.phoneCc)) },
      { text: t('verified') + ' ✓', onPress: () => onPatch({ phoneVerified: true, phoneVerifiedAt: new Date().toISOString() }, 'verify') },
    ]);
  };
  const Row = ({ k, v, icon }) => (v ? (
    <View style={st.infoRow}>
      <Ionicons name={icon} size={16} color={C.faint} style={{ marginTop: 3 }} />
      <View style={{ flex: 1, marginLeft: SP.md }}>
        <Txt style={st.infoK}>{t(k)}</Txt>
        <Txt style={st.infoV} selectable>{v}</Txt>
      </View>
    </View>
  ) : null);

  return (
    <View style={{ flex: 1 }}>
      <View style={st.formHead}>
        <Pressable onPress={back} hitSlop={10} style={st.iconBtn} accessibilityLabel="back"><Ionicons name="arrow-back" size={22} color={C.text} /></Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={shareProfile} hitSlop={10} style={st.iconBtn} accessibilityLabel={t('share')}><Ionicons name="share-social-outline" size={20} color={C.text} /></Pressable>
        <Pressable onPress={onEdit} hitSlop={10} style={[st.iconBtn, { marginLeft: SP.sm }]} accessibilityLabel={t('edit')}><Ionicons name="create-outline" size={20} color={C.text} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={st.screenPad} showsVerticalScrollIndicator={false}>
        <View style={st.idCard}>
          <View style={[st.idBand, { backgroundColor: STATUS_COLOR[p.status] }]}>
            <Txt style={st.idBandTxt}>{(settings.factoryName || t('brand')).toUpperCase()}</Txt>
            <Ionicons name="barcode-outline" size={18} color={C.limeInk} />
          </View>
          <View style={{ flexDirection: 'row', padding: SP.lg, alignItems: 'center' }}>
            <Avatar name={displayName(p)} size={70} />
            <View style={{ flex: 1, marginLeft: SP.lg }}>
              <Txt style={st.idName} selectable>{displayName(p)}</Txt>
              {p.nameEn ? <Txt style={st.idSub} selectable>{p.nameEn}</Txt> : null}
              <View style={{ flexDirection: 'row', marginTop: SP.sm, flexWrap: 'wrap', gap: 6 }}>
                <StatusPill status={p.status} t={t} big />
                {age != null ? <View style={[st.pill, { borderColor: C.line }]}><Txt style={[st.pillTxt, { color: C.sub }]}>{t('ageY', { n: age })}</Txt></View> : null}
              </View>
            </View>
          </View>
          <Pressable onPress={confirmVerify} style={[st.verifyBar, { backgroundColor: p.phoneVerified ? C.green + '1F' : C.sky + '14' }]} accessibilityRole="button">
            <Ionicons name={p.phoneVerified ? 'shield-checkmark' : 'shield-outline'} size={18} color={p.phoneVerified ? C.green : C.sky} />
            <View style={{ flex: 1, marginLeft: SP.sm }}>
              <Txt style={{ color: C.text, fontSize: F.lg, fontWeight: '800', letterSpacing: 0.5 }} selectable>{formatPhone(p.phone, p.phoneCc)}</Txt>
              <Txt style={{ color: p.phoneVerified ? C.green : C.sky, fontSize: F.xs }}>{p.phoneVerified ? t('verified') : t('notVerified') + ' · ' + t('verify')}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.faint} />
          </Pressable>
        </View>

        <View style={st.actionRow}>
          <ActionBtn icon="call" label={t('call')} color={C.lime} onPress={() => open(telUri(p.phone, p.phoneCc))} />
          <ActionBtn icon="chatbox-ellipses" label={t('sms')} color={C.sky} onPress={() => open('sms:' + (p.phoneCc === 'MM' ? '+95' + p.phone.slice(1) : p.phone))} />
          <ActionBtn icon="chatbubble" label={t('line')} color={C.green} onPress={() => (p.lineId ? open('https://line.me/R/ti/p/~' + encodeURIComponent(p.lineId), 'lineMissing') : notify(t('lineMissing'), 'warn'))} />
          <ActionBtn icon="share-social" label={t('share')} color={C.violet} onPress={shareProfile} />
        </View>

        <SectionTitle title={t('changeStatus')} icon="swap-horizontal-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.sm, paddingBottom: SP.sm }}>
          {STATUSES.map((s) => (
            <Chip key={s} label={t('st_' + s)} icon={STATUS_ICON[s]} color={STATUS_COLOR[s]} active={p.status === s}
              onPress={() => { if (s !== p.status) onPatch({ status: s }, 'status'); }} />
          ))}
        </ScrollView>

        {exp != null && exp <= (settings.expiryDays || 60) && p.status !== 'left' && p.status !== 'rejected' ? (
          <View style={[st.banner, { borderColor: C.coral + '66', backgroundColor: C.coral + '14', marginTop: SP.md }]}>
            <Ionicons name="time" size={16} color={C.coral} />
            <Txt style={{ color: C.text, marginLeft: SP.sm, flex: 1 }}>{t('docExpiry')}: {p.docExpiry} — {exp < 0 ? t('expired') : t('daysLeft', { n: exp })}</Txt>
          </View>
        ) : null}

        <SectionTitle title={t('secPersonal')} icon="person-outline" />
        <Card>
          <Row k="nickname" v={p.nickname} icon="happy-outline" />
          <Row k="gender" v={p.gender ? t(p.gender) : ''} icon="male-female-outline" />
          <Row k="dob" v={p.dob ? p.dob + (age != null ? '  (' + t('ageY', { n: age }) + ')' : '') : ''} icon="calendar-outline" />
          <Row k="phone2" v={formatPhone(p.phone2, p.phone2Cc)} icon="call-outline" />
          <Row k="lineId" v={p.lineId} icon="chatbubble-outline" />
          <Row k="facebook" v={p.facebook} icon="logo-facebook" />
          <Row k="hometown" v={p.hometown} icon="flag-outline" />
          <Row k="currentAddress" v={p.currentAddress} icon="location-outline" />
        </Card>

        <SectionTitle title={t('secDocs')} icon="card-outline" />
        <Card>
          <Row k="docType" v={t('dt_' + (p.docType || 'other'))} icon="document-outline" />
          <Row k="docNo" v={p.docNo} icon="barcode-outline" />
          <Row k="docExpiry" v={p.docExpiry ? p.docExpiry + (exp != null ? '  · ' + (exp < 0 ? t('expired') : t('daysLeft', { n: exp })) : '') : ''} icon="hourglass-outline" />
        </Card>

        <SectionTitle title={t('secJob')} icon="briefcase-outline" />
        <Card>
          <Row k="dept" v={p.dept} icon="business-outline" />
          <Row k="position" v={p.position} icon="construct-outline" />
          <Row k="shift" v={p.shift} icon="moon-outline" />
          <Row k="startDate" v={p.startDate} icon="enter-outline" />
          {!p.dept && !p.position && !p.shift && !p.startDate ? <Txt style={{ color: C.faint }}>{t('noData')}</Txt> : null}
        </Card>

        {(p.emName || p.emPhone) ? (
          <>
            <SectionTitle title={t('secEmergency')} icon="medkit-outline" />
            <Card>
              <Row k="emName" v={[p.emName, p.emRelation].filter(Boolean).join(' · ')} icon="people-outline" />
              {p.emPhone ? (
                <Pressable onPress={() => open(telUri(p.emPhone, p.emPhoneCc))}>
                  <Row k="emPhone" v={formatPhone(p.emPhone, p.emPhoneCc) + '  📞'} icon="call-outline" />
                </Pressable>
              ) : null}
            </Card>
          </>
        ) : null}

        {(settings.feeTracking && Number(p.fee) > 0) || p.notes ? (
          <>
            <SectionTitle title={t('secFee')} icon="wallet-outline" />
            <Card>
              {settings.feeTracking && Number(p.fee) > 0 ? (
                <View style={st.switchRow}>
                  <Txt style={{ color: C.text, fontSize: F.lg, fontWeight: '800', flex: 1 }}>฿{Number(p.fee).toLocaleString()}</Txt>
                  <Txt style={{ color: p.feePaid ? C.green : C.amber, marginRight: SP.sm }}>{t('feePaid')}</Txt>
                  <Switch value={!!p.feePaid} onValueChange={(v) => onPatch({ feePaid: v }, 'fee')} trackColor={{ true: C.green, false: C.line }} thumbColor={C.text} />
                </View>
              ) : null}
              <Row k="notes" v={p.notes} icon="create-outline" />
            </Card>
          </>
        ) : null}

        <SectionTitle title={t('history')} icon="time-outline" />
        <Card>
          {[...(p.history || [])].reverse().map((h, i) => (
            <View key={i} style={st.histRow}>
              <View style={[st.histDot, { backgroundColor: STATUS_COLOR[h.status] || C.faint }]} />
              <Txt style={{ color: C.text, flex: 1 }}>{t('st_' + h.status)}</Txt>
              <Txt style={{ color: C.faint, fontSize: F.sm }}>{fmtDateTime(h.at)}</Txt>
            </View>
          ))}
          <Txt style={{ color: C.faint, fontSize: F.xs, marginTop: SP.sm }}>{t('created')} {fmtDateTime(p.createdAt)} · {t('updated')} {fmtDateTime(p.updatedAt)}</Txt>
        </Card>

        <Btn label={t('delete')} icon="trash-outline" variant="danger" style={{ marginTop: SP.xl }}
          onPress={() => Alert.alert(t('delete'), t('confirmDelete'), [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: onDelete }])} />
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [st.actionBtn, pressed && { transform: [{ scale: 0.94 }] }]}>
      <View style={[st.actionIcon, { backgroundColor: color }]}><Ionicons name={icon} size={20} color={C.limeInk} /></View>
      <Txt style={st.actionLbl} numberOfLines={1}>{label}</Txt>
    </Pressable>
  );
}

/* ───────────────────────── PIN PAD ───────────────────────── */
function PinPad({ title, onSubmit, error, lockedSec, t, subtitle }) {
  const [pin, setPin] = useState('');
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!error) return;
    setPin('');
    Animated.sequence([10, -10, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  }, [error]);
  const press = (d) => {
    if (lockedSec > 0) return;
    if (d === 'del') { setPin((p) => p.slice(0, -1)); return; }
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) setTimeout(() => { onSubmit(next); }, 120);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <View style={{ alignItems: 'center', paddingTop: SP.xl }}>
      <View style={st.lockIcon}><Ionicons name="lock-closed" size={28} color={C.limeInk} /></View>
      <Txt style={{ color: C.text, fontSize: F.xl, fontWeight: '800', marginTop: SP.lg, textAlign: 'center' }}>{title}</Txt>
      {subtitle ? <Txt style={{ color: C.sub, marginTop: 4, textAlign: 'center' }}>{subtitle}</Txt> : null}
      <Animated.View style={{ flexDirection: 'row', gap: 18, marginVertical: SP.xl, transform: [{ translateX: shake }] }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[st.pinDot, i < pin.length && { backgroundColor: C.lime, borderColor: C.lime, transform: [{ scale: 1.15 }] }]} />
        ))}
      </Animated.View>
      <Txt style={{ color: C.red, minHeight: 24 }}>{lockedSec > 0 ? t('lockedFor', { n: lockedSec }) : error ? t('wrongPin') : ' '}</Txt>
      <View style={st.keypad}>
        {keys.map((k, i) => (k === '' ? <View key={i} style={st.key} /> : (
          <Pressable key={i} onPress={() => press(k)} style={({ pressed }) => [st.key, st.keyBg, pressed && { backgroundColor: C.lime }]} accessibilityRole="button" accessibilityLabel={k === 'del' ? 'delete' : k}>
            {({ pressed }) => (k === 'del'
              ? <Ionicons name="backspace-outline" size={24} color={pressed ? C.limeInk : C.text} />
              : <Text style={{ fontSize: 26, fontWeight: '700', color: pressed ? C.limeInk : C.text }}>{k}</Text>)}
          </Pressable>
        )))}
      </View>
    </View>
  );
}

/* ───────────────────────── ADMIN ───────────────────────── */
function ListEditor({ title, items, onChange, t, icon }) {
  const [v, setV] = useState('');
  const add = () => {
    const s = v.trim();
    if (!s || items.some((x) => x.toLowerCase() === s.toLowerCase())) { setV(''); return; }
    onChange([...items, s]); setV('');
  };
  return (
    <View style={{ marginBottom: SP.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm }}>
        <Ionicons name={icon} size={15} color={C.sub} />
        <Txt style={[st.label, { marginBottom: 0, marginLeft: 6 }]}>{title}</Txt>
      </View>
      <View style={st.chipWrap}>
        {items.map((it) => (
          <View key={it} style={[st.chip, { paddingRight: 6 }]}>
            <Txt style={st.chipTxt}>{it}</Txt>
            <Pressable onPress={() => onChange(items.filter((x) => x !== it))} hitSlop={8} style={{ marginLeft: 6 }} accessibilityLabel={'remove ' + it}>
              <Ionicons name="close-circle" size={17} color={C.faint} />
            </Pressable>
          </View>
        ))}
      </View>
      <View style={[st.inputWrap, { marginTop: SP.sm }]}>
        <TextInput value={v} onChangeText={setV} placeholder={t('addItemPh')} placeholderTextColor={C.faint} style={st.input} onSubmitEditing={add} returnKeyType="done" />
        <Pressable onPress={add} style={st.inlineBtn} accessibilityLabel="add"><Ionicons name="add" size={18} color={C.limeInk} /></Pressable>
      </View>
    </View>
  );
}

function AdminScreen({ settings, setSettings, people, setPeopleAll, log, addLog, t, notify, unlocked, setUnlocked, lang, setLang }) {
  const [err, setErr] = useState(0);
  const [fails, setFails] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [lockSec, setLockSec] = useState(0);
  const [pinModal, setPinModal] = useState(false);
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoreTxt, setRestoreTxt] = useState('');
  const [pins, setPins] = useState({ old: '', a: '', b: '' });
  const [pinErr, setPinErr] = useState('');
  const [local, setLocal] = useState(settings);
  useEffect(() => { setLocal(settings); }, [settings]);

  useEffect(() => {
    if (!lockUntil) return undefined;
    const tick = () => {
      const s = Math.ceil((lockUntil - Date.now()) / 1000);
      setLockSec(s > 0 ? s : 0);
      if (s <= 0) setLockUntil(0);
    };
    tick();
    const h = setInterval(tick, 500);
    return () => clearInterval(h);
  }, [lockUntil]);

  if (!unlocked) {
    return (
      <View style={st.screenPad}>
        <PinPad t={t} title={t('enterPin')} subtitle={t('adminTitle')} error={err} lockedSec={lockSec}
          onSubmit={(pin) => {
            if (hashPin(pin) === settings.pinHash) { setFails(0); setErr(0); setUnlocked(true); return; }
            const nf = fails + 1;
            setFails(nf); setErr((e) => e + 1);
            if (nf >= 5) { setLockUntil(Date.now() + 30000); setFails(0); }
          }} />
      </View>
    );
  }

  const update = (patch, quiet) => {
    const next = { ...local, ...patch };
    setLocal(next);
    setSettings(next);
    if (!quiet) addLog(t('log_settings'));
  };
  const counts = {}; STATUSES.forEach((s) => { counts[s] = people.filter((p) => p.status === s).length; });

  const exportCsv = () => Share.share({ message: toCsv(people), title: 'newperson.csv' }).catch(() => {});
  const exportBackup = () => Share.share({
    message: JSON.stringify({ app: 'newperson', version: 1, exportedAt: new Date().toISOString(), people }),
    title: 'newperson-backup.json',
  }).catch(() => {});
  const doRestore = () => {
    try {
      const obj = JSON.parse(restoreTxt.trim());
      const arr = Array.isArray(obj) ? obj : obj && obj.people;
      const res = mergeBackup(people, arr);
      if (!res) throw new Error('bad');
      setPeopleAll(res.people);
      addLog(t('log_restore', { n: res.count }));
      notify(t('restoreDone', { n: res.count }));
      setRestoreModal(false); setRestoreTxt('');
    } catch (e) { notify(t('invalidBackup'), 'error'); }
  };
  const changePin = () => {
    if (hashPin(pins.old) !== settings.pinHash) { setPinErr(t('wrongPin')); return; }
    if (!/^\d{4}$/.test(pins.a)) { setPinErr(t('pin4')); return; }
    if (pins.a !== pins.b) { setPinErr(t('pinMismatch')); return; }
    update({ pinHash: hashPin(pins.a) }, true);
    addLog(t('log_pin'));
    setPinModal(false); setPins({ old: '', a: '', b: '' }); setPinErr('');
    notify(t('pinChanged'));
  };

  return (
    <ScrollView contentContainerStyle={st.screenPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt style={[st.screenTitle, { flex: 1 }]}>{t('adminTitle')}</Txt>
        <Btn label={t('lock')} icon="lock-closed-outline" variant="ghost" small onPress={() => setUnlocked(false)} />
      </View>

      <View style={st.statGrid}>
        {STATUSES.map((s) => (
          <View key={s} style={[st.statCell, { borderTopColor: STATUS_COLOR[s] }]}>
            <Txt style={{ color: C.text, fontSize: F.xl, fontWeight: '900' }}>{counts[s]}</Txt>
            <Txt style={{ color: C.sub, fontSize: F.xs }} numberOfLines={1}>{t('st_' + s)}</Txt>
          </View>
        ))}
      </View>

      <SectionTitle title={t('language')} icon="language-outline" />
      <Card style={{ flexDirection: 'row', gap: SP.sm }}>
        {LANGS.map((l) => <Chip key={l.id} label={l.label} active={lang === l.id} onPress={() => setLang(l.id)} />)}
      </Card>

      <SectionTitle title={t('factoryName')} icon="business-outline" />
      <Card>
        <Field label={t('factoryName')} value={local.factoryName} onChangeText={(v) => setLocal({ ...local, factoryName: v })} autoCapitalize="words" />
        <Field label={t('recruiterName')} value={local.recruiterName} onChangeText={(v) => setLocal({ ...local, recruiterName: v })} autoCapitalize="words" />
        <Btn label={t('save')} icon="checkmark" small variant="soft" onPress={() => { update({ factoryName: local.factoryName.trim(), recruiterName: local.recruiterName.trim() }); notify(t('settingsSaved')); }} />
      </Card>

      <SectionTitle title={t('secJob')} icon="options-outline" />
      <Card>
        <ListEditor t={t} icon="business-outline" title={t('depts')} items={local.depts || []} onChange={(v) => update({ depts: v })} />
        <ListEditor t={t} icon="construct-outline" title={t('positions')} items={local.positions || []} onChange={(v) => update({ positions: v })} />
        <ListEditor t={t} icon="moon-outline" title={t('shifts')} items={local.shifts || []} onChange={(v) => update({ shifts: v })} />
      </Card>

      <SectionTitle title={t('requiredFields')} icon="checkbox-outline" />
      <Card>
        <Txt style={{ color: C.sub, fontSize: F.sm, marginBottom: SP.sm }}>{t('requiredHint')}</Txt>
        {['nameMm', 'phone'].map((k) => (
          <View key={k} style={st.switchRow}>
            <Txt style={{ color: C.text, flex: 1 }}>{t(k)}</Txt>
            <Ionicons name="lock-closed" size={14} color={C.faint} style={{ marginRight: 8 }} />
            <Switch value disabled trackColor={{ true: C.lime + '88', false: C.line }} thumbColor={C.text} />
          </View>
        ))}
        {OPTIONAL_REQUIRED.map((k) => (
          <View key={k} style={st.switchRow}>
            <Txt style={{ color: C.text, flex: 1 }}>{t(k)}{k === 'emName' || k === 'emPhone' ? ' (' + t('secEmergency') + ')' : ''}</Txt>
            <Switch value={!!(local.required && local.required[k])} onValueChange={(v) => update({ required: { ...(local.required || {}), [k]: v } })}
              trackColor={{ true: C.lime, false: C.line }} thumbColor={C.text} />
          </View>
        ))}
      </Card>

      <SectionTitle title={t('secFee')} icon="wallet-outline" />
      <Card>
        <View style={st.switchRow}>
          <Txt style={{ color: C.text, flex: 1 }}>{t('feeTracking')}</Txt>
          <Switch value={!!local.feeTracking} onValueChange={(v) => update({ feeTracking: v })} trackColor={{ true: C.lime, false: C.line }} thumbColor={C.text} />
        </View>
        <Field label={t('defaultFee')} value={String(local.defaultFee || '')} keyboardType="number-pad"
          onChangeText={(v) => setLocal({ ...local, defaultFee: v.replace(/\D/g, '') })} />
        <Field label={t('expiryDays')} value={String(local.expiryDays || '')} keyboardType="number-pad"
          onChangeText={(v) => setLocal({ ...local, expiryDays: v.replace(/\D/g, '') })} />
        <Btn label={t('save')} icon="checkmark" small variant="soft" onPress={() => {
          const days = Math.min(365, Math.max(1, Number(local.expiryDays) || 60));
          update({ defaultFee: local.defaultFee, expiryDays: days }); notify(t('settingsSaved'));
        }} />
      </Card>

      <SectionTitle title={t('dataPrivacy')} icon="shield-half-outline" />
      <Card style={{ gap: SP.sm }}>
        <Txt style={{ color: C.sub, fontSize: F.sm, marginBottom: SP.xs }}>{t('privacyNote')}</Txt>
        <Btn label={t('exportCsv')} icon="grid-outline" variant="soft" onPress={exportCsv} disabled={!people.length} />
        <Btn label={t('backup')} icon="cloud-upload-outline" variant="soft" onPress={exportBackup} disabled={!people.length} />
        <Btn label={t('restore')} icon="cloud-download-outline" variant="soft" onPress={() => setRestoreModal(true)} />
        <Btn label={t('changePin')} icon="key-outline" variant="ghost" onPress={() => setPinModal(true)} />
        <Btn label={t('wipe')} icon="trash-outline" variant="danger" disabled={!people.length} onPress={() => Alert.alert(t('wipe'), t('wipeConfirm'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('wipe'), style: 'destructive', onPress: () => { setPeopleAll([]); addLog(t('log_wipe')); notify(t('wipeDone')); } },
        ])} />
      </Card>

      <SectionTitle title={t('activity')} icon="list-outline" />
      <Card>
        {log.length === 0 ? <Txt style={{ color: C.faint }}>{t('noData')}</Txt> : log.slice(0, 40).map((l, i) => (
          <View key={i} style={st.histRow}>
            <View style={[st.histDot, { backgroundColor: C.lime }]} />
            <Txt style={{ color: C.text, flex: 1, fontSize: F.sm }} numberOfLines={2}>{l.text}</Txt>
            <Txt style={{ color: C.faint, fontSize: F.xs }}>{fmtDateTime(l.at)}</Txt>
          </View>
        ))}
      </Card>
      <Txt style={{ color: C.faint, textAlign: 'center', marginTop: SP.xl, fontSize: F.xs }}>Newperson v1.0.0</Txt>
      <View style={{ height: 120 }} />

      <Modal visible={pinModal} transparent animationType="fade" onRequestClose={() => setPinModal(false)}>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <Txt style={st.modalTitle}>{t('changePin')}</Txt>
            <Field label={t('oldPin')} value={pins.old} onChangeText={(v) => setPins({ ...pins, old: digits(v).slice(0, 4) })} keyboardType="number-pad" secure maxLength={4} />
            <Field label={t('newPin')} value={pins.a} onChangeText={(v) => setPins({ ...pins, a: digits(v).slice(0, 4) })} keyboardType="number-pad" secure maxLength={4} />
            <Field label={t('pinAgain')} value={pins.b} onChangeText={(v) => setPins({ ...pins, b: digits(v).slice(0, 4) })} keyboardType="number-pad" secure maxLength={4} />
            {pinErr ? <Txt style={{ color: C.red, marginBottom: SP.sm }}>{pinErr}</Txt> : null}
            <View style={{ flexDirection: 'row', gap: SP.sm }}>
              <Btn label={t('cancel')} variant="ghost" style={{ flex: 1 }} onPress={() => { setPinModal(false); setPinErr(''); setPins({ old: '', a: '', b: '' }); }} />
              <Btn label={t('save')} style={{ flex: 1 }} onPress={changePin} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={restoreModal} transparent animationType="fade" onRequestClose={() => setRestoreModal(false)}>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <Txt style={st.modalTitle}>{t('restore')}</Txt>
            <Field label={t('pasteBackup')} value={restoreTxt} onChangeText={setRestoreTxt} multiline placeholder='{"app":"newperson", ...}' />
            <View style={{ flexDirection: 'row', gap: SP.sm }}>
              <Btn label={t('cancel')} variant="ghost" style={{ flex: 1 }} onPress={() => { setRestoreModal(false); setRestoreTxt(''); }} />
              <Btn label={t('restore')} style={{ flex: 1 }} disabled={!restoreTxt.trim()} onPress={doRestore} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ───────────────────────── ONBOARDING ───────────────────────── */
function Onboarding({ settings, onDone }) {
  const [lang, setLang] = useState(settings.lang || 'my');
  const t = useMemo(() => makeT(lang), [lang]);
  const [name, setName] = useState('');
  const [factory, setFactory] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [error, setError] = useState('');
  const go = () => {
    if (!/^\d{4}$/.test(p1)) { setError(t('pin4')); return; }
    if (p1 !== p2) { setError(t('pinMismatch')); return; }
    onDone({ ...settings, lang, recruiterName: name.trim(), factoryName: factory.trim(), pinHash: hashPin(p1), onboarded: true });
  };
  return (
    <ScrollView contentContainerStyle={[st.screenPad, { paddingTop: TOP + SP.xl }]} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', gap: SP.sm, justifyContent: 'flex-end' }}>
        {LANGS.map((l) => <Chip key={l.id} label={l.label} active={lang === l.id} onPress={() => setLang(l.id)} />)}
      </View>
      <View style={st.obArt}>
        <View style={[st.obTile, { backgroundColor: C.lime, transform: [{ rotate: '-8deg' }] }]}><Ionicons name="person-add" size={34} color={C.limeInk} /></View>
        <View style={[st.obTile, { backgroundColor: C.coral, transform: [{ rotate: '6deg' }], marginLeft: -14, marginTop: 28 }]}><Ionicons name="call" size={30} color={C.limeInk} /></View>
        <View style={[st.obTile, { backgroundColor: C.sky, transform: [{ rotate: '-3deg' }], marginLeft: -14 }]}><Ionicons name="card" size={30} color={C.limeInk} /></View>
      </View>
      <Txt style={st.obTitle}>{t('welcome')}</Txt>
      <Txt style={st.obSub}>{t('obSub')}</Txt>
      <Card style={{ marginTop: SP.xl }}>
        <Field label={t('recruiterName')} value={name} onChangeText={setName} placeholder={t('yourNamePh')} autoCapitalize="words" />
        <Field label={t('factoryName')} value={factory} onChangeText={setFactory} placeholder={t('factoryPh')} autoCapitalize="words" />
        <Field label={t('setPin')} value={p1} onChangeText={(v) => { setP1(digits(v).slice(0, 4)); setError(''); }} keyboardType="number-pad" secure maxLength={4} required />
        <Field label={t('pinAgain')} value={p2} onChangeText={(v) => { setP2(digits(v).slice(0, 4)); setError(''); }} keyboardType="number-pad" secure maxLength={4} required
          error={!!error} errorText={error} />
      </Card>
      <Btn label={t('start')} icon="arrow-forward" onPress={go} style={{ marginTop: SP.xl }} />
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

/* ───────────────────────── SPLASH ───────────────────────── */
function Splash() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={[st.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <Animated.View style={[st.logoMark, { width: 84, height: 84, borderRadius: 28, transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) }] }]}>
        <Ionicons name="person-add" size={38} color={C.limeInk} />
      </Animated.View>
      <Text style={{ color: C.text, fontSize: F.xl, fontWeight: '900', marginTop: SP.lg, letterSpacing: 3 }}>NEW·PERSON</Text>
      <ActivityIndicator color={C.lime} style={{ marginTop: SP.lg }} />
    </View>
  );
}

/* ───────────────────────── APP ───────────────────────── */
export default function App() {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [people, setPeople] = useState([]);
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]); // overlay screens: {name, params}
  const [listParams, setListParams] = useState({});
  const [toast, setToast] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [kb, setKb] = useState(false);
  const [reduce, setReduce] = useState(false);
  const guardRef = useRef(null);
  const peopleRef = useRef(people);
  peopleRef.current = people;

  const lang = settings.lang || 'my';
  const t = useMemo(() => makeT(lang), [lang]);
  const notify = useCallback((text, kind) => setToast({ text, kind, k: Date.now() }), []);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, l] = await Promise.all([AsyncStorage.getItem(K.settings), AsyncStorage.getItem(K.people), AsyncStorage.getItem(K.log)]);
        if (s) setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (p) { const arr = JSON.parse(p); if (Array.isArray(arr)) setPeople(arr); }
        if (l) { const arr = JSON.parse(l); if (Array.isArray(arr)) setLog(arr); }
      } catch (e) { /* corrupted storage → start clean, keep app usable */ }
      try { setReduce(!!(await AccessibilityInfo.isReduceMotionEnabled())); } catch (e) { /* ignore */ }
      setTimeout(() => setReady(true), 500);
    })();
    const a = Keyboard.addListener('keyboardDidShow', () => setKb(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  const persistPeople = async (next) => {
    try { await AsyncStorage.setItem(K.people, JSON.stringify(next)); return true; } catch (e) { notify(t('saveFailed'), 'error'); return false; }
  };
  const setPeopleAll = async (next) => { const ok = await persistPeople(next); if (ok) setPeople(next); return ok; };
  const setSettings = (next) => {
    setSettingsState(next);
    AsyncStorage.setItem(K.settings, JSON.stringify(next)).catch(() => notify(t('saveFailed'), 'error'));
  };
  const addLog = (text) => {
    setLog((prev) => {
      const next = [{ text, at: new Date().toISOString() }, ...prev].slice(0, 200);
      AsyncStorage.setItem(K.log, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const go = (name, params = {}) => {
    if (name === 'list') { setListParams({ ...params, _k: Date.now() }); setStack([]); setTab('list'); return; }
    setStack((s) => [...s, { name, params }]);
  };
  const back = () => setStack((s) => s.slice(0, -1));

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (guardRef.current && guardRef.current()) return true;
      if (stack.length) { back(); return true; }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack, tab]);

  useEffect(() => { if (tab !== 'admin') setUnlocked(false); }, [tab]);

  const savePerson = async (rec, isNew) => {
    const cur = peopleRef.current;
    const next = isNew ? [rec, ...cur] : cur.map((p) => (p.id === rec.id ? rec : p));
    const ok = await setPeopleAll(next);
    if (!ok) return false;
    addLog(t(isNew ? 'log_add' : 'log_edit', { name: displayName(rec) }));
    notify(t('saved'));
    guardRef.current = null;
    setStack((s) => {
      const top = s.slice(0, -1);
      if (isNew) return [...top, { name: 'detail', params: { id: rec.id } }];
      return top;
    });
    return true;
  };
  const patchPerson = async (id, patch, kind) => {
    const cur = peopleRef.current;
    const p = cur.find((x) => x.id === id);
    if (!p) return;
    const now = new Date().toISOString();
    const rec = { ...p, ...patch, updatedAt: now };
    if (patch.status && patch.status !== p.status) {
      rec.history = [...(p.history || []), { status: patch.status, at: now }];
      if (patch.status === 'started' && !p.startDate) rec.startDate = fmtDate(new Date());
    }
    const ok = await setPeopleAll(cur.map((x) => (x.id === id ? rec : x)));
    if (!ok) return;
    if (kind === 'status') { addLog(t('log_status', { name: displayName(p), s: t('st_' + patch.status) })); notify(t('statusChanged')); }
    else if (kind === 'verify') { addLog(t('log_verify', { name: displayName(p) })); notify(t('verified')); }
    else notify(t('saved'));
  };
  const deletePerson = async (id) => {
    const cur = peopleRef.current;
    const p = cur.find((x) => x.id === id);
    const ok = await setPeopleAll(cur.filter((x) => x.id !== id));
    if (!ok) return;
    if (p) addLog(t('log_del', { name: displayName(p) }));
    notify(t('deleted'));
    back();
  };

  if (!ready) return (<><StatusBar barStyle="light-content" backgroundColor="transparent" translucent /><Splash /></>);

  if (!settings.onboarded) {
    return (
      <View style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Onboarding settings={settings} onDone={(s) => setSettings(s)} />
      </View>
    );
  }

  const top = stack[stack.length - 1];
  let overlay = null;
  if (top && top.name === 'form') {
    const initial = top.params.id ? people.find((p) => p.id === top.params.id) : null;
    overlay = (
      <PersonForm key={'form-' + (top.params.id || 'new')} initial={initial} people={people} settings={settings} t={t}
        onSave={savePerson} onCancel={() => { guardRef.current = null; back(); }} guardRef={guardRef} notify={notify} />
    );
  } else if (top && top.name === 'detail') {
    const person = people.find((p) => p.id === top.params.id);
    overlay = (
      <DetailScreen key={'detail-' + top.params.id} person={person} settings={settings} t={t} back={back} notify={notify}
        onEdit={() => go('form', { id: top.params.id })}
        onDelete={() => deletePerson(top.params.id)}
        onPatch={(patch, kind) => patchPerson(top.params.id, patch, kind)} />
    );
  }

  const TABS = [
    { id: 'home', icon: 'grid', label: t('home') },
    { id: 'list', icon: 'people', label: t('people') },
    { id: 'add', icon: 'add', label: t('add') },
    { id: 'admin', icon: 'settings', label: t('admin') },
  ];

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flex: 1, paddingTop: TOP }}>
        {overlay || (
          <View style={{ flex: 1 }}>
            {tab === 'home' && <HomeScreen people={people} settings={settings} t={t} go={go} reduce={reduce} />}
            {tab === 'list' && <ListScreen people={people} settings={settings} t={t} go={go} params={listParams} />}
            {tab === 'admin' && (
              <AdminScreen settings={settings} setSettings={setSettings} people={people} setPeopleAll={setPeopleAll}
                log={log} addLog={addLog} t={t} notify={notify} unlocked={unlocked} setUnlocked={setUnlocked}
                lang={lang} setLang={(l) => setSettings({ ...settings, lang: l })} />
            )}
          </View>
        )}
      </View>
      {!overlay && !kb ? (
        <View style={st.navWrap}>
          <View style={st.nav}>
            {TABS.map((tb) => {
              if (tb.id === 'add') {
                return (
                  <Pressable key="add" onPress={() => go('form', {})} style={st.navAdd} accessibilityRole="button" accessibilityLabel={t('newPerson')}>
                    <Ionicons name="add" size={30} color={C.limeInk} />
                  </Pressable>
                );
              }
              const active = tab === tb.id;
              return (
                <Pressable key={tb.id} onPress={() => setTab(tb.id)} style={st.navItem} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={tb.label}>
                  <Ionicons name={active ? tb.icon : tb.icon + '-outline'} size={22} color={active ? C.lime : C.faint} />
                  <Txt style={[st.navLbl, active && { color: C.lime }]} numberOfLines={1}>{tb.label}</Txt>
                  {active ? <View style={st.navDot} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      <Toast toast={toast} />
    </View>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  txt: { color: C.text, fontSize: F.md, lineHeight: F.md * 1.55 },
  screenPad: { padding: SP.lg, paddingTop: SP.md },
  screenTitle: { fontSize: F.xxl, fontWeight: '900', color: C.text, lineHeight: F.xxl * 1.35, marginBottom: SP.md, letterSpacing: -0.5 },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, paddingHorizontal: SP.lg, borderRadius: R.md, borderWidth: 1.5 },
  btnSmall: { minHeight: 38, paddingHorizontal: SP.md, borderRadius: R.sm },
  btnTxt: { fontSize: F.md, fontWeight: '800' },

  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, minHeight: 38, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface },
  chipTxt: { color: C.sub, fontSize: F.sm, lineHeight: F.sm * 1.6 },
  chipCount: { marginLeft: 6, backgroundColor: C.surface2, borderRadius: R.pill, paddingHorizontal: 7, minWidth: 22, alignItems: 'center' },
  chipCountTxt: { color: C.sub, fontSize: F.xs, fontWeight: '800', lineHeight: F.xs * 1.7 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },

  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3 },
  pillDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  pillTxt: { fontSize: F.xs, fontWeight: '700', lineHeight: F.xs * 1.7 },

  secTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: SP.xl, marginBottom: SP.md },
  secTitle: { color: C.text, fontSize: F.md, fontWeight: '800', letterSpacing: 0.3 },

  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: SP.lg, borderWidth: 1, borderColor: C.line },

  field: { marginBottom: SP.lg },
  label: { color: C.sub, fontSize: F.sm, marginBottom: SP.sm, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line },
  input: { flex: 1, color: C.text, fontSize: F.md, paddingHorizontal: SP.md, minHeight: 50, lineHeight: F.md * 1.5 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  msg: { fontSize: F.sm, lineHeight: F.sm * 1.55, flexShrink: 1 },
  inlineBtn: { backgroundColor: C.lime, borderRadius: R.sm, paddingHorizontal: 10, minHeight: 32, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  inlineBtnTxt: { color: C.limeInk, fontWeight: '800', fontSize: F.xs },

  ccToggle: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: R.pill, padding: 3, borderWidth: 1, borderColor: C.line },
  ccBtn: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: R.pill },
  ccTxt: { color: C.sub, fontSize: F.xs, fontWeight: '700', lineHeight: F.xs * 1.8 },

  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },

  homeHead: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg, marginTop: SP.sm },
  hello: { color: C.sub, fontSize: F.md },
  factory: { color: C.text, fontSize: F.xl, fontWeight: '900', lineHeight: F.xl * 1.4, letterSpacing: -0.3 },
  logoMark: { width: 50, height: 50, borderRadius: 17, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },

  hero: { backgroundColor: C.lime, borderRadius: 28, padding: SP.xl, overflow: 'hidden' },
  heroBlob: { position: 'absolute', right: -50, top: -50, width: 190, height: 190, borderRadius: 95, borderWidth: 26, borderColor: 'rgba(0,0,0,0.07)' },
  heroLabel: { color: C.limeInk, fontSize: F.sm, fontWeight: '700', opacity: 0.75 },
  heroNum: { color: C.limeInk, fontSize: 84, fontWeight: '900', lineHeight: 96, letterSpacing: -4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: R.md, padding: SP.md, marginTop: SP.sm },
  heroStat: { flex: 1 },
  heroStatNum: { color: C.limeInk, fontSize: F.xl, fontWeight: '900', lineHeight: F.xl * 1.3 },
  heroStatLbl: { color: C.limeInk, fontSize: F.xs, opacity: 0.75, lineHeight: F.xs * 1.7 },
  heroSep: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(0,0,0,0.15)', marginHorizontal: SP.md },

  stackBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 3 },
  legendWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SP.md },
  legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingRight: SP.sm },
  legendTxt: { color: C.sub, fontSize: F.sm, flex: 1 },
  legendNum: { color: C.text, fontWeight: '800', fontSize: F.md },

  alertRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: C.line, borderLeftWidth: 4 },
  alertIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  ticket: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  ticketStripe: { width: 6 },
  ticketName: { color: C.text, fontSize: F.lg, fontWeight: '800', lineHeight: F.lg * 1.45 },
  ticketSub: { color: C.sub, fontSize: F.sm, lineHeight: F.sm * 1.55 },
  ticketDivider: { height: 18, justifyContent: 'center', marginVertical: 4 },
  dash: { borderTopWidth: 1.5, borderColor: C.line, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },
  ticketPhone: { color: C.text, fontWeight: '700', marginLeft: 6, letterSpacing: 0.5 },
  ticketDate: { color: C.faint, fontSize: F.xs, marginLeft: 6 },
  alertDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  empty: { alignItems: 'center', paddingVertical: SP.xxl, paddingHorizontal: SP.lg },
  emptyIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.line, borderStyle: 'dashed' },
  emptyTitle: { color: C.text, fontSize: F.lg, fontWeight: '800', marginTop: SP.lg, textAlign: 'center' },
  emptySub: { color: C.sub, textAlign: 'center', marginTop: 4 },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line, paddingHorizontal: SP.md, minHeight: 50 },
  searchInput: { flex: 1, color: C.text, fontSize: F.md, marginLeft: SP.sm, lineHeight: F.md * 1.5 },
  sortTxt: { color: C.sub, fontSize: F.sm, fontWeight: '700' },

  formHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderBottomWidth: 1, borderBottomColor: C.line },
  formTitle: { flex: 1, color: C.text, fontSize: F.lg, fontWeight: '800', marginHorizontal: SP.md },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  banner: { flexDirection: 'row', alignItems: 'center', padding: SP.md, borderRadius: R.md, borderWidth: 1, borderColor: C.amber + '55', backgroundColor: C.amber + '14' },

  idCard: { backgroundColor: C.surface, borderRadius: 26, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  idBand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.lg, paddingVertical: 8 },
  idBandTxt: { color: C.limeInk, fontWeight: '900', fontSize: F.xs, letterSpacing: 2, flex: 1 },
  idName: { color: C.text, fontSize: F.xl, fontWeight: '900', lineHeight: F.xl * 1.45 },
  idSub: { color: C.sub, fontSize: F.sm, letterSpacing: 0.5 },
  verifyBar: { flexDirection: 'row', alignItems: 'center', padding: SP.md, paddingHorizontal: SP.lg, borderTopWidth: 1, borderTopColor: C.line },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SP.lg },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  actionLbl: { color: C.sub, fontSize: F.xs, marginTop: 6 },

  infoRow: { flexDirection: 'row', paddingVertical: 8 },
  infoK: { color: C.faint, fontSize: F.xs },
  infoV: { color: C.text, fontSize: F.md },

  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  histDot: { width: 10, height: 10, borderRadius: 5, marginRight: SP.md },

  lockIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.faint },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 288, justifyContent: 'space-between', marginTop: SP.md },
  key: { width: 84, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  keyBg: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  statCell: { width: '31.5%', backgroundColor: C.surface, borderRadius: R.md, padding: SP.md, borderTopWidth: 3, borderWidth: 1, borderColor: C.line },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: SP.lg },
  modalCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: SP.xl, borderWidth: 1, borderColor: C.line },
  modalTitle: { color: C.text, fontSize: F.xl, fontWeight: '900', marginBottom: SP.lg, lineHeight: F.xl * 1.4 },

  obArt: { flexDirection: 'row', justifyContent: 'center', marginTop: SP.xxl, marginBottom: SP.xl, height: 120 },
  obTile: { width: 86, height: 86, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: C.bg },
  obTitle: { color: C.text, fontSize: 30, fontWeight: '900', lineHeight: 30 * 1.45, letterSpacing: -0.5 },
  obSub: { color: C.sub, fontSize: F.md, marginTop: SP.sm },

  navWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SP.lg, paddingBottom: Platform.OS === 'ios' ? 28 : 14 },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(27,30,41,0.97)', borderRadius: 26, paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: C.line, elevation: 12, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  navLbl: { color: C.faint, fontSize: F.xs, marginTop: 2, lineHeight: F.xs * 1.6 },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.lime, marginTop: 2 },
  navAdd: { width: 60, height: 60, borderRadius: 22, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, marginTop: -26, transform: [{ rotate: '-6deg' }], elevation: 8, borderWidth: 4, borderColor: C.bg },

  toast: { position: 'absolute', left: SP.lg, right: SP.lg, bottom: 104, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface2, borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: C.line, elevation: 14 },
  toastDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SP.md },
});

/* Exposed only for the automated render tests in tests/ (not used by the app). */
export const __screens = { HomeScreen, ListScreen, PersonForm, DetailScreen, AdminScreen, Onboarding, Splash, emptyPerson, DEFAULT_SETTINGS, T };
