-- Insert new questions into the questions table

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Insert questions
INSERT INTO questions (question, course_id, answer, data) VALUES 
(
    '血浆的主要作用', 
    2,  -- Biology
    '运载血细胞运输人体生命活动所需的营养物质和体内产生的废物。',
    '{"mastery_level": "已掌握", "total_answers": 2, "page_reference": null}'::JSONB
),
(
    '长征的原因和意义', 
    1,  -- History
    '第五次反围剿失败；意义：反对国民党消灭共产党的企图，保持了党的基干力量，铸就了长征精神。',
    '{"mastery_level": "已掌握", "total_answers": 2, "page_reference": null}'::JSONB
),
(
    '长江水能丰富的原因', 
    3,  -- Geography
    '上游地形落差大水流急；上游流经亚热带季风气候区，降水多汇入支流多水量大。',
    '{"mastery_level": "需复习", "total_answers": 1, "page_reference": "第49页"}'::JSONB
),
(
    '长江干流流经哪11个行政区和简称；黄河干流流经哪9个行政区和简称', 
    3,  -- Geography
    '长江：清川藏云、于鄂湘、济郁宛户；黄河：青川宁蒙、晋陕豫鲁（简称）。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": null}'::JSONB
),
(
    '血液循环系统的5个部分', 
    2,  -- Biology
    '心脏、动脉、静脉、毛细血管和血液。',
    '{"mastery_level": "已掌握", "total_answers": 3, "page_reference": null}'::JSONB
),
(
    '陕甘宁袁贵川六个省的简称及行政中心', 
    3,  -- Geography
    '陕：西安；甘：兰州；宁：银川；袁：南昌；贵：贵阳；川：成都。',
    '{"mastery_level": "需复习", "total_answers": 1, "page_reference": null}'::JSONB
),
(
    '青春期情绪特点产生的原因', 
    4,  -- Politics
    '身体发育加快，生活经验不断丰富。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": null}'::JSONB
),
(
    '中国34个省级行政中心的分类与简称', 
    3,  -- Geography
    '华北5省、西北5省、西南5省、华南5省、华中3省、东北3省、华东8省，简称与行政中心。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": null}'::JSONB
),
(
    '有利于聚落形成与发展的六个主要条件', 
    3,  -- Geography
    '土壤肥沃，地形平坦，水源充足，自然资源丰富，交通便利，气候温暖。口诀：土地水自交器。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": null}'::JSONB
),
(
    '情感的分类', 
    4,  -- Politics
    '正面、负面、复杂情感，例：安全感等。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": null}'::JSONB
),
(
    '为什么要学会情绪表达', 
    4,  -- Politics
    '人际情绪相互感染；有助于身心健康和人际交往。',
    '{"mastery_level": "已掌握", "total_answers": 2, "page_reference": null}'::JSONB
),
(
    '为什么要调节情绪', 
    4,  -- Politics
    '学会正确对待情绪，适应环境，更好地面对生活，帮助家人和同学。',
    '{"mastery_level": "需复习", "total_answers": 1, "page_reference": null}'::JSONB
),
(
    '人体的泌尿系统有哪四部分组成及作用', 
    2,  -- Biology
    '待补充。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": "第85页"}'::JSONB
),
(
    '长江航运价值大的原因', 
    3,  -- Geography
    '自然原因：降水多，汇入支流多，水量大。待补充剩余。',
    '{"mastery_level": "需补充", "total_answers": 0, "page_reference": null}'::JSONB
),
(
    '专业会议的内容和意义', 
    NULL,  -- No specific course
    '主题演讲、研究成果交流、促进合作与行业发展。',
    '{"mastery_level": "未掌握", "total_answers": 0, "page_reference": null}'::JSONB
);

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
