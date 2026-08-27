/**
 * 七宗罪×七美德 价值观MBTI测试 — 题库
 * 来源于 价值观MBTI测试.html 中的 dimensions 数组
 * 收纳版：非计分题（excluded，即"XX之罪是"英文二选一）保留；
 * 其余为 -3~3 量表计分题。
 *
 * type 字段（用于题型声明，方便未来添加题目）：
 *   - type: 'choice'   : 标记为"英文二选一"不定量题，前端渲染成 A/B 两键；
 *                       需配合 excluded: true 使用，前端据此显示"不计分"、scoring 据此跳过计分。
 *   - 无 type（量表题）: 正常渲染 -3~3 量表并计入总分。
 * 新增一道英文二选一知识题，直接写一行即可，例如：
 *   { text: 'XXX之罪是：A：Xxx  B：Xxx', type: 'choice', excluded: true, reverse: false }
 *
 * reverse 方向约定（决定得分方向）：
 *   - 题干标注"罪孽深：A，则认知深刻：B" → reverse: false（默认）
 *   - 题干标注"罪孽深：B，则认知深刻：A" → reverse: true
 * 善良维度计分同走 reverse，最终由 scoring.js 统一反向（高=认知深）。
 */
var dimensions = [
  {
    id: 'pride', name: '傲慢（Arrogance）', nameResult: '傲慢（Pride）',
    icon: '👑', color: '#c0392b', colorLight: '#e74c3c',
    questions: [
      { text: '以下哪一个行为更接近傲慢的本质：A：霸凌、家暴等一系列上位者对下位者的打压。  B：不愿意承认错误。', reverse: false },
      { text: '从全人类的角度看，哪一个原罪对他人的伤害更重？A：嫉妒  B：傲慢', reverse: false },
      { text: '你更认可：A：如果个人成就十分伟大，有点傲慢也无可厚非，厉害强大的人都会有一点不服输的傲气  B：无论成就多大，傲慢都不应该被认可', reverse: false },
      { text: '傲慢的糟糕与邪恶，更在于哪一点？A：对他人的伤害  B：对自身发展的阻碍，使人盲目', reverse: true },
      { text: '认为“世界是一个巨大的草台班子”本质是一种傲慢。A：同意  B：不同意', reverse: false },
      { text: '真正的谦虚是：A：谦谦君子  B：痛恨傲慢', reverse: false },
      { text: '“无人外人，无山外山”是傲慢的体现。A：同意  B：不同意', reverse: false },
      { text: '是否可以理解“傲慢之罪（Pride）对应的美德是正义（Justice）”之中的逻辑：A：可以理解  B：不能理解', reverse: true },
      { text: '你更认可：A：智商高的人，情商不一定高  B：智商高的人，情商一定也高', reverse: false },
      { text: '你更认可：A：人与人之间的智力差距比人与狗之间的差距还大  B：人类的基础智力差距不大，人与人之间的智力差距没有想象中那么夸张', reverse: false },
      { text: '一个人能承认“自己可能错了”，这更多是：A：一种理性、智慧上的超然  B：拥有谦虚的美好品质', reverse: true },
      { text: '“把平台当能力”这种行为：A：非常常见  B：没有人们想的那么多', reverse: true },
      { text: '你更认可：A：“风口上的猪”，成就是时代红利  B：“时代的潮头”，成就靠智慧与机遇并存', reverse: true },
      { text: '你更认可：A：一切脱离了成果的构思都是幻想、甚至妄想，任何工作都必须以成果说话  B：好的构思就是好的构思，即使成果还没做出来，也无法否认它的价值', reverse: false },
      { text: '真正厉害的人，往往：A：发自内心觉得自己没什么了不起  B：很清楚自己是什么水平', reverse: false },
      { text: '你认为“自大”和“自信”最大的区别是什么？A：是否有实力支撑  B：是否愿意承认错误', reverse: false },
      { text: '傲慢之罪是：A：Pride  B：Arrogance', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'envy', name: '嫉妒（Envy）', nameResult: '嫉妒（Envy）',
    icon: '🐍', color: '#8e44ad', colorLight: '#9b59b6',
    questions: [
      { text: '从全人类的角度看，哪一个原罪对他人的伤害更重？A：嫉妒  B：暴怒', reverse: true },
      { text: '能否理解“嫉妒（Envy）之罪对应的美德是明辨（Prudence）/审视/三思”中的逻辑：A：可以理解  B：不能理解', reverse: true },
      { text: '你更认可：A：父亲嫉妒儿子这种事是不可能的，或只是极端个别的“基因变异”  B：世上确实存在嫉妒儿子的父亲，而且数量并非可以忽略不计', reverse: false },
      { text: '你更认可：A：善于引导嫉妒心，可以让它成为自己的动力  B：嫉妒是罪孽，需要压制，它无法成为动力', reverse: false },
      { text: '一个人看到朋友成功却心里不舒服，他最可能：A：没意识到这是一种不好的情绪  B：知道这样不好，但控制不住', reverse: true },
      { text: '宽容一个你嫉妒的人，最难的是：A：认清嫉妒是罪孽的  B：审视嫉妒点的内在逻辑', reverse: false },
      { text: '“嫉妒”和“羡慕”，最大的区别是：A：嫉妒是希望对方失去；羡慕是希望自己拥有  B：两者没有本质区别，只是程度不同', reverse: false },
      { text: '嫉妒最核心的痛苦来自：A：别人拥有了自己想要的东西  B：别人的存在让自己显得不够好', reverse: false },
      { text: '要真正减少嫉妒，最有效的是：A：提升自己的认知水平  B：平衡自己的心态', reverse: true },
      { text: '嫉妒之罪是：A：Envy  B：Jealousy', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'wrath', name: '暴怒（Wrath）', nameResult: '暴怒（Wrath）',
    icon: '🔥', color: '#d35400', colorLight: '#e67e22',
    questions: [
      { text: '是否可以理解“暴怒（Wrath）之罪对应的美德是勇敢/坚毅（Fortitude）”的内在逻辑：A：可以理解  B：不能理解', reverse: true },
      { text: '你更认可：A：暴怒不仅指所谓的“有罪的、邪恶的”愤怒，还包括各种“为正义”的怒火。无论出发点好坏，都在此人性罪的定义范畴内  B：暴怒仅仅是指有罪的、邪恶的愤怒', reverse: false },
      { text: '你更认可：A：面对压力时，必须要有发泄的出口  B：面对压力时，可以通过分析原因自我消化', reverse: false },
      { text: '你更认可：A：愤怒成为罪孽的原因是“自私”  B：愤怒作为原罪是一种独立的存在，怒火本身就是罪，并不依赖其他因素', reverse: true },
      { text: '你更认可：A：天生性格温和、生活顺畅、不需要发火的人虽然稀少，但的确存在  B：任何压力都必须要释放，不需要发火的人并不存在', reverse: false },
      { text: '你更认可：A：愤怒用得好，也可以成为一种动力  B：愤怒是罪孽，需要压制，无法成为动力', reverse: true },
      { text: '一个人如果经常因为小事发火，他最需要解决的是：A：学习情绪管理技巧  B：找到发火的根源', reverse: false },
      { text: '暴怒之罪被认为是严重、邪恶的原因是：A：因为它伤害他人  B：不仅因为它伤害他人，也因为它会越严重地伤害自己的身体', reverse: true },
      { text: '路怒症的本质，更可能是：A：脾气暴躁，缺乏耐心  B：无力感的爆发，平时压抑过多', reverse: true },
      { text: '一个人从不发火，更可能是因为：A：相对来说性格稀有，天生温和  B：擅长在愤怒出现前处理掉', reverse: false },
      { text: '你觉得人生哪个阶段（婴儿，少年，青年，中年，老年）的人更容易暴怒？A：婴儿  B：老年', reverse: false },
      { text: '暴怒之罪是：A：Wrath  B：Anger', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'sloth', name: '懒惰（Sloth）', nameResult: '懒惰（Sloth）',
    icon: '🦥', color: '#7f8c8d', colorLight: '#95a5a6',
    questions: [
      { text: '下面哪个罪孽对人类群体和社会的伤害更大？A：懒惰  B：贪婪', reverse: true },
      { text: '我可以理解“懒惰之罪（Sloth）对应的美德是希望（Hope）”中的逻辑：A：可以理解  B：不能理解', reverse: true },
      { text: '“社会养懒汉虽然影响不大，但肯定会阻碍社会发展”：A：不同意  B：同意', reverse: true },
      { text: '你更认可：A：创造欲、创造价值是人最本能的渴望，但这种本能的渴望并不强烈，会被懒惰和不劳而获的欲望压制  B：创造欲是人强烈而稳固的本能，不会被懒惰轻易压制', reverse: false },
      { text: '你更认可：A：“佛系”和“躺平”有一部分因素是懒惰的本能  B：创造欲和工作愿望是人的本能，“佛系”和“躺平”取决于环境', reverse: false },
      { text: '已知“傲慢，嫉妒”是灵性罪，“暴食，色欲”是肉体罪，则懒惰（Sloth）是：A：灵性罪  B：肉体罪', reverse: true },
      { text: '对“真正的英雄主义是认清生活的真相后，仍然热爱生活”这句话：A：有很大感触，很理解深刻含义。  B：不反感，但对这句话没大的感触', reverse: true },
      { text: '你更认可：A：懒惰是人的本能，总的来说，大部分“躺平”的人是在为懒惰找借口  B：创造欲也是人的本能，大部分“躺平”的人是没有办法', reverse: false },
      { text: '你认为懒惰和休息最大的区别是什么？A：休息是为了恢复，懒惰是逃避  B：懒惰和休息本质没有区别，懒惰是休息过度', reverse: false },
      { text: '一般来说人生的阶段：婴儿、少年、青年、中年、老年，哪个阶段的人更容易懒惰（Sloth）？A：婴儿  B：老年', reverse: false },
      { text: '关于懒惰，你更认可：A：懒惰的人往往对结果无所谓  B：懒惰的人往往对过程无兴趣', reverse: false },
      { text: '懒惰之罪是：A：Sloth  B：Laziness', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'greed', name: '贪婪（Greed）', nameResult: '贪婪（Greed）',
    icon: '💰', color: '#c0392b', colorLight: '#e74c3c',
    questions: [
      { text: '下面哪个罪孽对周围人的伤害更大？A：懒惰  B：贪婪', reverse: false },
      { text: '已知“傲慢，嫉妒”是灵性罪，“暴食，色欲是肉体罪”，则贪婪是：A：灵性罪  B：肉体罪', reverse: true },
      { text: '已知合作和竞争都是人类原始的本能，获得东西与给予东西得到的正反馈，哪一个更大？A：得到东西得到的正反馈更大  B：奉献东西得到的正反馈更大', reverse: true },
      { text: '“占有更多资源是人类的本能”，你更认可：A：是，物竞天择  B：不是，更多是社会环境塑造的', reverse: true },
      { text: '物质极大丰富后，人会自然减少自私：A：会，资源充足就不必争抢  B：不会，自私是本能，需要教化压制', reverse: false },
      { text: '“想要更多”的贪婪和“有上进心”的进取，区别在于：A：是否损害别人  B：是否永远不满足', reverse: true },
      { text: '一个人如果不愿意分享，最可能是因为：A：基因的本能没有被压制教化，无法被满足  B：过去的经历，比如童年，塑造了不愿分享的性格', reverse: true },
      { text: '你更认可：A：赌场里的人总会输光，因为小资金和大资金对赌，一直赌下去总会输光  B：如果一直输，那是谁在赢呢？赌博是纯概率事件，没有确定的结果', reverse: true },
      { text: '你认为贪婪和进取心最大的区别是什么？A：进取心有边界，贪婪无边界  B：进取心不伤害他人，贪婪伤害他人', reverse: false },
      { text: '贪婪之罪是：A：Greed  B：Avarice', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'gluttony', name: '暴食（Gluttony）', nameResult: '暴食（Gluttony）',
    icon: '🍷', color: '#c0392b', colorLight: '#e74c3c',
    questions: [
      { text: '你更认可：A：长胖只和进食摄入量、运动输出量有关  B：长胖和基因也有关，不同的人长胖和减肥的难易程度确实不同', reverse: true },
      { text: '一个每天严格控制饮食的人，你更认可：A：是为了健康  B：不全是为了健康，也有执着、自律、美丽等其他因素', reverse: true },
      { text: '成瘾行为的根源是：A：意志力薄弱  B：精神空虚', reverse: true },
      { text: '一个人用吃来缓解压力，结果会：A：暂时缓解，长期更糟  B：缓解压力的方式多种多样，重要的是压力得到释放', reverse: true },
      { text: '一个人心情不好时：A：胃口会变差  B：想吃更多东西来缓解', reverse: true },
      { text: '一个人总是“买买买”，和一个人总是“吃吃吃”，本质上共同点是：A：都缺乏自控力  B：都在用感官刺激填补内心空洞', reverse: true },
      { text: '凡事有度，但这个“度”应该由谁来定义？A：理性的思考  B：每个人的认知不同，思考的结果不同，应该根据个人身体和心灵的感受', reverse: true },
      { text: '暴食之罪是：A：Gluttony  B：Overeating', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'lust', name: '色欲（Lust）', nameResult: '色欲（Lust）',
    icon: '💋', color: '#e91e63', colorLight: '#f06292',
    questions: [
      { text: '爱情中的专一，是一种选择还是本能？A：选择，需要意志和坚持  B：本能，真爱自然排他', reverse: true },
      { text: '性和爱可以完全分开吗？A：可以，生理需求可以独立  B：不可以，太难分开，几乎不可能分开，爱几乎一定要建立在性之上', reverse: true },
      { text: '对于“专一是反人性的”，你更认同：A：同意，所以需要付出意志力来坚持  B：不同意，专一不是反人性的，它是本能的一部分，只是需要被发掘出来', reverse: true },
      { text: '对于“一个人可能会同时喜欢上两个人”，你更认可：A：同意，爱是一种难以被定义的抽象情感  B：不同意，当喜欢上第二个的时候就说明已经不爱第一个了，一夫一妻是为了稳定和保护双方', reverse: false },
      { text: '“部分人能对伴侣保持长期忠诚”，最主要是因为：A：没有遇到足够强的诱惑  B：内心有清晰的边界', reverse: false },
      { text: '你认为色欲和爱情最大的区别是什么？A：爱情包含承诺，色欲只有肉体  B：色欲是本能，爱情是更上层的建筑', reverse: false },
      { text: '色欲之罪是：A：Lust  B：Desire', type: 'choice', excluded: true, reverse: false }
    ]
  },
  {
    id: 'goodness', name: '善良认知', nameResult: '善良认知',
    icon: '✨', color: '#2c3e50', colorLight: '#34495e',
    questions: [
      { text: '“智慧和善良无关或者说至少不是强相关，越聪明的人可能越会害人”：A：同意  B：不同意', reverse: false },
      { text: '“善良并不是仇视邪恶，而是温文尔雅、温润如玉，仇视邪恶的本质主要是仇恨”：A：同意  B：不同意，善良与痛恨邪恶不矛盾', reverse: false },
      { text: '下面哪一种是更高的赞扬？A：富有同情心的  B：理智的', reverse: false },
      { text: '你更认可：A：人身上只存在感性（本能）和理性，也就是所谓的兽性和神性  B：除了感性和理性，人性是更复杂的，层叠的，它还有更丰富的，更复杂的内在', reverse: true },
      { text: '你更认可：A：嫉恶如仇并不是善良，善良是平静美丽的海面，包容万物  B：痛恨罪恶就是善良的表现之一', reverse: false },
      { text: '你更认可：A：蠢就是坏，坏就是蠢  B：蠢与坏是两回事，这决定了能不能被原谅', reverse: true },
      { text: '“真正善良的人也可能会堕入邪恶”：A：不同意  B：同意', reverse: true },
      { text: '支持家庭、哺育孩子，养育孩子，算不算利他行为？A：算  B：不算', reverse: false },
      { text: '你更认可：A：自私是邪恶的一部分，并且是几乎全部的邪恶  B：自私是邪恶的一部分，但还有更多其他的邪恶的行为', reverse: true },
      { text: '关于“自私不在七宗罪之中”，你更认可：A：自私是更底层的本能，用“自私”作为一个“原罪”太笼统了  B：自私和背叛、双标等行为是更高级的人类行为。', reverse: true },
      { text: '我可以想象出比“被父母杀死的孩子”更悲惨的人生：A：可以  B：不能', reverse: false },
      { text: '我可以想象出比“被父母遗弃”更悲惨的人生。A：可以  B：不能', reverse: true },
      { text: '你更认可：A：理性并不一定代表善良、美好  B：理性代表善良、美好', reverse: false },
      { text: '大一学生被大三的学生会学姐霸凌，她们到大三后开始霸凌新的大一学生。受害者变成加害者，这体现了：A：人性的复杂，受害者可以转变为加害者  B：原本就不是什么好人', reverse: false },
      { text: '一个童年缺失父母、长大后性格孤僻、不懂爱人、甚至已经伤过人的人，你更认可：A：是可以被理解的，但也未必值得原谅  B：小时候缺爱与长大后是否爱人无关或者至少没有强相关', reverse: false },
      { text: '如果一个以前温柔善良的人也变得会霸凌他人，那是因为：A：人性是复杂的，人生是复杂的  B：温良并不是善良，以前并不善良', reverse: false },
      { text: '你更认可：A：真正的善良是发自内心的、不经过任何思索加工的最纯真的感情，善良取决于心底的目的  B：真正的善良需要理智的思考', reverse: false },
      { text: '你更认可：A：论迹不论心，论心无圣人  B：论心不论迹', reverse: false },
      { text: '“善良意味着宽容，可以原谅邪恶”还是“越善良越无法原谅邪恶”：A：宽容，可以原谅邪恶的行为、人的罪孽  B：越善良越无法原谅邪恶，因为二者是天然的对立面', reverse: false },
      { text: '你更认可：A：“生而不养”绝对是罪孽，但平心而论，并非不可饶恕的极大罪孽  B：“生而不养”就是极大的罪孽', reverse: false },
      { text: '你更认可：A：地球上所有的资源是人类共有的  B：资源是人类共有的，但现实中一般是先到先得，开采资源的人付出了成本，没有他们的努力资源就是废铁，理应获得更多回报', reverse: true },
      { text: '你更认可：A：慈善是一种选择，而不是责任  B：资源越多责任越大', reverse: false },
      { text: '关于“赌狗必死”，你更认可：A：非常同意，赌狗就像吸毒一样，甚至更可怕  B：不同意，每个人都有重新做人的权利', reverse: false },
      { text: '封存吸毒人员档案，是一种防止社会人员知道同事是否有吸毒史的措施，你更认可：A：这是正确的决定，所有人都需要重新做人的机会  B：这会伤害吸毒者身边的人，不应该封存，周围的人有知情的权利，这也是吸毒者该承受的代价之一', reverse: true }
    ]
  }
];

module.exports = { dimensions: dimensions };