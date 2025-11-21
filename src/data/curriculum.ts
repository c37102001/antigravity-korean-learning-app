import type { Curriculum } from '../types';

export const curriculum: Curriculum = {
    weeks: [
        {
            id: 'week-1',
            title: 'Week 1：打地基（句型骨架 & 助詞）',
            description: '完成後：能說「我是志豪、這是咖啡、我在台灣工作」',
            days: [
                {
                    id: 'w1-d1',
                    title: 'Day 1：예요 / 이에요 (是)',
                    description: '名詞結尾的「是」。判斷有無收尾音（Batchim）。',
                    content: {
                        grammar: [
                            {
                                title: '예요 / 이에요',
                                explanation: '韓文的「是」放在句尾。前面的名詞如果**沒有收尾音（母音結尾）**用 **예요**；如果**有收尾音（子音結尾）**用 **이에요**。',
                                examples: [
                                    { korean: '저는 學生이에요.', chinese: '我是學生。 (學生 hak-saeng 有收尾音)' },
                                    { korean: '이것은 사과예요.', chinese: '這是蘋果。 (蘋果 sa-gwa 無收尾音)' }
                                ]
                            }
                        ],
                        examples: [
                            { korean: '저예요.', chinese: '是我。' },
                            { korean: '물이에요.', chinese: '是水。' },
                            { korean: '친구예요.', chinese: '是朋友。' }
                        ],
                        supplementary: '💡 記憶法：有收尾音時，像是要把那個音「連」過去，所以用以母音 ㅇ 開頭的 이에요 比較順口。',
                        exercises: [
                            { id: 'ex1', question: '咖啡 (커피) + 是', answer: '커피예요', hint: '커피 沒有收尾音' },
                            { id: 'ex2', question: '包包 (가방) + 是', answer: '가방이에요', hint: '가방 有收尾音' }
                        ]
                    }
                },
                {
                    id: 'w1-d2',
                    title: 'Day 2：이/가 vs 은/는',
                    description: '主語助詞 vs 主題助詞，韓文最難搞懂的助詞雙胞胎。',
                    content: {
                        grammar: [
                            {
                                title: '은 / 는 (主題助詞)',
                                explanation: '表示「至於...」、「關於...」，強調後面的內容，或用於對比。無收尾音用 는，有收尾音用 은。',
                                examples: [
                                    { korean: '저는 대만 사람이에요.', chinese: '我(是)台灣人。 (強調我是什麼人)' }
                                ]
                            },
                            {
                                title: '이 / 가 (主語助詞)',
                                explanation: '表示動作的主詞，或強調「誰」做了什麼。無收尾音用 가，有收尾音用 이。',
                                examples: [
                                    { korean: '제가 했어요.', chinese: '是我做的。 (強調是我)' },
                                    { korean: '날씨가 좋아요.', chinese: '天氣很好。' }
                                ]
                            }
                        ],
                        examples: [
                            { korean: '이것은 책이에요.', chinese: '這本書是書。' },
                            { korean: '이름이 뭐예요?', chinese: '名字是什麼？' }
                        ],
                        supplementary: '💡 初學者攻略：自我介紹、說明特徵時多用 은/는；描述現象、狀態、或是問「什麼/誰」的時候多用 이/가。',
                        exercises: [
                            { id: 'ex1', question: '저 (我) + 은/는', answer: '저는', hint: '저 沒有收尾音' },
                            { id: 'ex2', question: '이름 (名字) + 이/가', answer: '이름이', hint: '이름 有收尾音' }
                        ]
                    }
                },
                {
                    id: 'w1-d3',
                    title: 'Day 3：있어요 / 없어요 (有/沒有)',
                    description: '存在與否，也可以表示「在/不在」。',
                    content: {
                        grammar: [
                            {
                                title: '있어요 (有/在)',
                                explanation: '表示某人或某物存在。前面通常接 이/가。',
                                examples: [
                                    { korean: '돈이 있어요.', chinese: '有錢。' },
                                    { korean: '집에 있어요.', chinese: '在家裡。' }
                                ]
                            },
                            {
                                title: '없어요 (沒有/不在)',
                                explanation: '表示某人或某物不存在。',
                                examples: [
                                    { korean: '시간이 없어요.', chinese: '沒時間。' }
                                ]
                            }
                        ],
                        examples: [
                            { korean: '남자 친구가 있어요?', chinese: '有男朋友嗎？' },
                            { korean: '약속이 없어요.', chinese: '沒有約。' }
                        ],
                        supplementary: '💡 注意：있어요/없어요 前面的名詞助詞通常用 이/가，而不是 은/는（除非有對比語氣）。',
                        exercises: [
                            { id: 'ex1', question: '有傘 (우산)。', answer: '우산이 있어요', hint: '記得加助詞 이' },
                            { id: 'ex2', question: '沒有水 (물)。', answer: '물이 없어요', hint: '記得加助詞 이' }
                        ]
                    }
                },
                {
                    id: 'w1-d4',
                    title: 'Day 4：動詞現在式 (아요/어요/해요)',
                    description: '韓文動詞變化的核心規則。',
                    content: {
                        grammar: [
                            {
                                title: '아요 / 어요 / 해요',
                                explanation: '1. 母音是 ㅏ, ㅗ → 아요\n2. 其他母音 → 어요\n3. 하다 結尾 → 해요',
                                examples: [
                                    { korean: '가다 (去) → 가요', chinese: '去。' },
                                    { korean: '먹다 (吃) → 먹어요', chinese: '吃。' },
                                    { korean: '공부하다 (讀書) → 공부해요', chinese: '讀書。' }
                                ]
                            }
                        ],
                        examples: [
                            { korean: '지금 뭐 해요?', chinese: '現在在做什麼？' },
                            { korean: '학교에 가요.', chinese: '去學校。' },
                            { korean: '점심을 먹어요.', chinese: '吃午餐。' }
                        ],
                        supplementary: '💡 這是最常用的「非格式體敬語」，對長輩、陌生人都可以用，禮貌又不生硬。',
                        exercises: [
                            { id: 'ex1', question: '보다 (看) → ?', answer: '봐요', hint: '보 + 아요 = 봐요' },
                            { id: 'ex2', question: '마시다 (喝) → ?', answer: '마셔요', hint: '마시 + 어요 = 마셔요' }
                        ]
                    }
                },
                {
                    id: 'w1-d5',
                    title: 'Day 5：에 / 에서 (地點助詞)',
                    description: '靜態地點 vs 動態地點。',
                    content: {
                        grammar: [
                            {
                                title: '에 (靜態/方向)',
                                explanation: '1. 存在的地點 (在...)\n2. 移動的目的地 (去...)',
                                examples: [
                                    { korean: '집에 있어요.', chinese: '在家。' },
                                    { korean: '회사에 가요.', chinese: '去公司。' }
                                ]
                            },
                            {
                                title: '에서 (動態)',
                                explanation: '在某地「做某動作」。',
                                examples: [
                                    { korean: '카페에서 커피를 마셔요.', chinese: '在咖啡廳喝咖啡。' },
                                    { korean: '도서관에서 공부해요.', chinese: '在圖書館讀書。' }
                                ]
                            }
                        ],
                        examples: [
                            { korean: '어디에 살아요?', chinese: '住在哪裡？' },
                            { korean: '한국에서 왔어요.', chinese: '從韓國來。 (에서 也有「從」的意思)' }
                        ],
                        supplementary: '💡 判斷法：問自己「是不是在那個地方做動作？」是→에서，只是「在」或「去」→에。',
                        exercises: [
                            { id: 'ex1', question: '在學校 (학교) 讀書。', answer: '학교에서', hint: '讀書是動作' },
                            { id: 'ex2', question: '去學校 (학교)。', answer: '학교에', hint: '去是移動方向' }
                        ]
                    }
                },
                {
                    id: 'w1-d6',
                    title: 'Day 6：綜合練習',
                    description: '把這週學的全部串起來！',
                    content: {
                        grammar: [],
                        examples: [
                            { korean: '저는 회사원이에요. 서울에 살아요.', chinese: '我是上班族。住在首爾。' },
                            { korean: '주말에 친구를 만나요. 카페에서 이야기해요.', chinese: '週末見朋友。在咖啡廳聊天。' }
                        ],
                        supplementary: '今天沒有新文法，試著造句看看吧！',
                        exercises: [
                            { id: 'ex1', question: '翻譯：我在家吃飯。(밥을 먹어요)', answer: '집에서 밥을 먹어요', hint: '在家(做動作)' },
                            { id: 'ex2', question: '翻譯：今天沒有時間。(오늘 / 시간)', answer: '오늘 시간이 없어요', hint: '沒時間' }
                        ]
                    }
                },
                {
                    id: 'w1-d7',
                    title: 'Day 7：複習＋自我介紹',
                    description: '成果驗收：用韓文介紹自己。',
                    content: {
                        grammar: [],
                        examples: [
                            { korean: '안녕하세요. 저는 [名字]예요.', chinese: '你好，我是[名字]。' },
                            { korean: '대만 사람이에요.', chinese: '我是台灣人。' },
                            { korean: '반가워요.', chinese: '很高興認識你。' }
                        ],
                        supplementary: '恭喜完成第一週！試著把這些句子背下來，下次遇到韓國人就能用了。',
                        exercises: [
                            { id: 'ex1', question: '寫下你的自我介紹 (名字/國籍)', answer: '', hint: '自由發揮' }
                        ]
                    }
                }
            ]
        }
    ]
};
