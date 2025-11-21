export interface Vocabulary {
    id: string;
    korean: string;
    chinese: string;
    partOfSpeech?: string;
}

export const vocabulary: Vocabulary[] = [
    { id: 'v1', korean: '학생', chinese: '學生' },
    { id: 'v2', korean: '사과', chinese: '蘋果' },
    { id: 'v3', korean: '물', chinese: '水' },
    { id: 'v4', korean: '친구', chinese: '朋友' },
    { id: 'v5', korean: '커피', chinese: '咖啡' },
    { id: 'v6', korean: '가방', chinese: '包包' },
    { id: 'v7', korean: '저', chinese: '我 (謙稱)' },
    { id: 'v8', korean: '이름', chinese: '名字' },
    { id: 'v9', korean: '돈', chinese: '錢' },
    { id: 'v10', korean: '집', chinese: '家' },
    { id: 'v11', korean: '시간', chinese: '時間' },
    { id: 'v12', korean: '우산', chinese: '雨傘' },
    { id: 'v13', korean: '가다', chinese: '去' },
    { id: 'v14', korean: '먹다', chinese: '吃' },
    { id: 'v15', korean: '공부하다', chinese: '讀書' },
    { id: 'v16', korean: '보다', chinese: '看' },
    { id: 'v17', korean: '마시다', chinese: '喝' },
    { id: 'v18', korean: '학교', chinese: '學校' },
    { id: 'v19', korean: '회사', chinese: '公司' },
    { id: 'v20', korean: '도서관', chinese: '圖書館' },
];
