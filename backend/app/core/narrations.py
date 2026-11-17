"""Tầng core – lời thuyết minh mẫu cho 18 động vật, mỗi lời đọc khoảng 20–30 giây, đủ 3 ngôn ngữ (vi, en, zh).

Dùng bởi app/core/sample_data.py khi nạp POI mới và khi chạy:  python -m app.core.sample_data --update
"""

NARRATIONS = {
    "Panthera tigris": (
        "Chào mừng bạn đến chuồng hổ. Hổ là loài mèo lớn nhất thế giới, có thể dài tới ba mét và nặng hơn hai trăm "
        "ki lô gam. Mỗi con hổ có bộ sọc riêng, giống như vân tay của con người. Khác với nhiều loài mèo, hổ rất thích "
        "nước và bơi giỏi. Hổ sống đơn độc và săn mồi vào lúc chạng vạng. Hiện nay trên thế giới chỉ còn khoảng năm "
        "nghìn con hổ hoang dã, vì vậy chúng rất cần được bảo vệ.",
        "Welcome to the tiger enclosure. The tiger is the largest cat in the world, reaching three metres in length and "
        "weighing over two hundred kilograms. Every tiger has its own stripe pattern, just like a human fingerprint. "
        "Unlike most cats, tigers love water and are strong swimmers. They live alone and hunt at dusk. Only about five "
        "thousand wild tigers remain today, so they urgently need our protection.",
        "欢迎来到老虎馆。老虎是世界上最大的猫科动物，体长可达三米，体重超过两百公斤。每只老虎的条纹都独一无二，"
        "就像人类的指纹一样。和大多数猫不同，老虎喜欢水，而且很会游泳。它们独来独往，常在黄昏时捕猎。"
        "如今野外只剩下大约五千只老虎，非常需要我们的保护。"),
    "Panthera leo": (
        "Đây là chuồng sư tử, chúa tể của thảo nguyên châu Phi. Sư tử là loài mèo duy nhất sống theo bầy đàn. "
        "Con đực có chiếc bờm dày, bờm càng sẫm màu thì con đực càng khỏe mạnh. Trong bầy, các con cái phối hợp với "
        "nhau để săn mồi, còn con đực bảo vệ lãnh thổ. Tiếng gầm của sư tử có thể vang xa tới tám ki lô mét. Mỗi ngày "
        "sư tử có thể ngủ tới hai mươi tiếng để tiết kiệm sức lực.",
        "This is the lion enclosure, home of the king of the African savanna. Lions are the only cats that live in "
        "groups called prides. Males have a thick mane, and the darker the mane, the healthier the lion. Females work "
        "together to hunt, while males defend the territory. A lion's roar can be heard up to eight kilometres away. "
        "Lions may sleep up to twenty hours a day to save energy.",
        "这里是狮子馆，住着非洲草原之王。狮子是唯一群居的猫科动物，一个狮群叫作“狮群”。雄狮有浓密的鬃毛，鬃毛颜色越深，"
        "说明它越强壮。母狮们合作捕猎，雄狮负责守卫领地。狮子的吼声可以传到八公里之外。为了节省体力，"
        "狮子每天可以睡上二十个小时。"),
    "Ursus thibetanus": (
        "Bạn đang đứng trước chuồng gấu ngựa, còn gọi là gấu đen châu Á. Hãy nhìn vệt lông trắng hình chữ V trên ngực "
        "chúng, giống như một chiếc vòng cổ hình trăng lưỡi liềm. Gấu ngựa leo cây rất giỏi và rất thích ăn mật ong, "
        "trái cây và măng rừng. Ở Việt Nam, nhiều con gấu ngựa từng bị nuôi nhốt để lấy mật. Những cá thể ở đây được "
        "chăm sóc để có cuộc sống tốt hơn. Hãy nói không với các sản phẩm từ mật gấu.",
        "You are in front of the Asian black bear, also called the moon bear. Look at the white V-shaped patch on its "
        "chest, like a crescent moon necklace. Moon bears are excellent climbers and love honey, fruit and bamboo "
        "shoots. In Vietnam, many of them were once kept in small cages for their bile. The bears here are cared for "
        "so they can live a better life. Please say no to bear bile products.",
        "您现在看到的是亚洲黑熊，也叫月熊。请看它胸前白色的V形斑纹，就像一条月牙形的项链。亚洲黑熊非常会爬树，"
        "最爱吃蜂蜜、水果和竹笋。在越南，许多黑熊曾被关在小笼子里抽取胆汁。这里的黑熊得到了悉心照顾，"
        "过上了更好的生活。请拒绝熊胆制品。"),
    "Ailurus fulgens": (
        "Đây là chuồng gấu trúc đỏ. Dù tên có chữ gấu trúc, chúng không phải họ hàng gần của gấu trúc lớn mà thuộc một "
        "họ riêng. Gấu trúc đỏ chỉ to bằng con mèo nhà, có bộ lông nâu đỏ và chiếc đuôi dài có khoanh. Chúng sống trên "
        "cây ở vùng núi Himalaya và ăn lá tre là chủ yếu. Khi trời lạnh, chúng cuộn chiếc đuôi xù quanh người như một "
        "chiếc chăn ấm. Hãy quan sát kỹ, chúng thường nằm ngủ trên cành cao.",
        "This is the red panda enclosure. Despite the name, red pandas are not close relatives of giant pandas and "
        "belong to their own family. They are about the size of a house cat, with reddish-brown fur and a long ringed "
        "tail. They live in the trees of the Himalayan mountains and eat mostly bamboo leaves. When it is cold, they "
        "wrap their bushy tail around themselves like a warm blanket. Look closely, they often sleep on high branches.",
        "这里是小熊猫馆。虽然名字里有“熊猫”，但小熊猫和大熊猫并不是近亲，而是自成一科。它们只有家猫那么大，"
        "皮毛红褐色，尾巴长长的带着环纹。小熊猫生活在喜马拉雅山区的树上，主要吃竹叶。天冷时，"
        "它们会用蓬松的尾巴裹住身体，像盖了一条暖和的毯子。仔细看看，它们常常在高高的树枝上睡觉。"),
    "Pygathrix nemaeus": (
        "Bạn đang đứng trước chuồng voọc chà vá chân nâu, được mệnh danh là nữ hoàng linh trưởng. Hãy nhìn khuôn mặt "
        "vàng cam, đôi tay trắng và đôi chân nâu đỏ như đang mặc quần đùi. Loài này sống chủ yếu ở miền Trung Việt Nam, "
        "nổi tiếng nhất là ở bán đảo Sơn Trà, Đà Nẵng. Chúng ăn lá non và có dạ dày nhiều ngăn để tiêu hóa lá. Voọc chà "
        "vá chân nâu đang cực kỳ nguy cấp và là niềm tự hào của thiên nhiên Việt Nam.",
        "You are standing in front of the red-shanked douc, known as the queen of primates. Look at its golden-orange "
        "face, white arms and maroon legs that look like a pair of shorts. This monkey lives mainly in central Vietnam, "
        "most famously on the Son Tra peninsula in Da Nang. It eats young leaves and has a stomach with several "
        "chambers to digest them. The douc is critically endangered and a true pride of Vietnam's nature.",
        "您现在站在红腿白臀叶猴的笼舍前，它被誉为“灵长类女王”。请看它金橙色的脸、白色的手臂和红褐色的腿，"
        "就像穿了一条短裤。它们主要生活在越南中部，最著名的栖息地是岘港的山茶半岛。红腿白臀叶猴以嫩叶为食，"
        "拥有多室的胃来消化树叶。它们极度濒危，是越南大自然的骄傲。"),
    "Nomascus leucogenys": (
        "Đây là chuồng vượn đen má trắng. Vượn không có đuôi và có đôi tay rất dài để đu cành thật nhanh. Điều thú vị là "
        "màu lông thay đổi theo tuổi: con non lông vàng, sau đó chuyển sang đen, rồi con cái lại đổi thành màu vàng khi "
        "trưởng thành. Mỗi buổi sáng, cặp vượn đực cái cùng hót một bản song ca vang khắp khu rừng để giữ lãnh thổ. "
        "Nếu đến sớm, bạn có thể được nghe tiếng hót đặc biệt này.",
        "This is the northern white-cheeked gibbon enclosure. Gibbons have no tail and very long arms for swinging "
        "quickly through the trees. Interestingly, their fur changes colour with age: babies are yellow, then turn "
        "black, and females turn yellow again as adults. Every morning the male and female sing a loud duet that echoes "
        "through the forest to defend their territory. If you come early, you may hear this special song.",
        "这里是北白颊长臂猿馆。长臂猿没有尾巴，长长的手臂让它们能在树间快速摆荡。有趣的是，它们的毛色会随年龄变化："
        "幼崽是黄色的，之后变成黑色，雌性成年后又会变回黄色。每天清晨，雌雄长臂猿会合唱一首响亮的二重唱，"
        "回荡在整片森林中，用来宣示领地。如果您早点来，也许能听到这特别的歌声。"),
    "Elephas maximus": (
        "Đây là chuồng voi châu Á, loài thú lớn nhất trên cạn ở châu Á. Voi châu Á nhỏ hơn voi châu Phi và có đôi tai "
        "nhỏ hơn. Chiếc vòi của voi có hàng chục nghìn bó cơ, dùng để thở, ngửi, uống nước và nhặt cả những vật rất nhỏ. "
        "Mỗi ngày một con voi trưởng thành có thể ăn tới một trăm năm mươi ki lô gam cỏ và lá cây. Voi rất thông minh, "
        "có trí nhớ tốt và sống theo đàn do con cái lớn tuổi nhất dẫn đầu.",
        "This is the Asian elephant enclosure, home of Asia's largest land animal. Asian elephants are smaller than "
        "African elephants and have smaller ears. An elephant's trunk has tens of thousands of muscle bundles and is "
        "used to breathe, smell, drink and even pick up tiny objects. An adult can eat up to one hundred and fifty "
        "kilograms of grass and leaves a day. Elephants are very intelligent, have great memories and live in herds "
        "led by the oldest female.",
        "这里是亚洲象馆，住着亚洲最大的陆地动物。亚洲象比非洲象小，耳朵也更小。大象的鼻子由数万束肌肉组成，"
        "可以用来呼吸、闻气味、喝水，甚至捡起很小的东西。一头成年大象每天可以吃掉多达一百五十公斤的草和树叶。"
        "大象非常聪明，记忆力很好，象群由最年长的母象带领。"),
    "Giraffa camelopardalis": (
        "Hãy ngước lên nhìn hươu cao cổ, động vật cao nhất trên cạn, có thể cao gần sáu mét. Thật bất ngờ, chiếc cổ dài "
        "ấy chỉ có bảy đốt sống, bằng đúng số đốt sống cổ của con người. Lưỡi hươu cao cổ dài khoảng năm mươi phân và "
        "có màu sẫm để không bị cháy nắng khi ăn lá cây keo. Hươu cao cổ ngủ rất ít, thường chỉ vài tiếng mỗi ngày và "
        "có thể ngủ khi đang đứng. Mỗi con có hoa văn đốm riêng, không con nào giống con nào.",
        "Look up at the giraffe, the tallest animal on land at almost six metres. Surprisingly, that long neck has only "
        "seven vertebrae, exactly the same number as ours. A giraffe's tongue is about fifty centimetres long and dark "
        "in colour so it does not get sunburnt while eating acacia leaves. Giraffes sleep very little, often just a few "
        "hours a day, and can even sleep standing up. Each giraffe has its own unique pattern of patches.",
        "请抬头看看长颈鹿，它是陆地上最高的动物，身高接近六米。令人惊讶的是，这么长的脖子只有七节颈椎，"
        "和我们人类的数量一样。长颈鹿的舌头长约五十厘米，颜色较深，吃金合欢树叶时不容易被晒伤。"
        "长颈鹿睡得很少，每天只睡几个小时，甚至可以站着睡觉。每只长颈鹿身上的斑纹都独一无二。"),
    "Equus quagga": (
        "Đây là chuồng ngựa vằn. Bạn có biết, dưới lớp lông sọc, da ngựa vằn có màu sẫm? Mỗi con ngựa vằn có bộ sọc riêng "
        "như vân tay, giúp ngựa con nhận ra mẹ giữa cả đàn. Các nhà khoa học cho rằng sọc vằn còn giúp xua đuổi ruồi "
        "cắn và làm thú săn mồi rối mắt khi cả đàn bỏ chạy. Ở châu Phi, ngựa vằn di cư hàng trăm ki lô mét mỗi năm theo "
        "những cơn mưa để tìm cỏ non.",
        "This is the zebra enclosure. Did you know that under the striped coat, a zebra's skin is dark? Each zebra has "
        "its own stripe pattern like a fingerprint, which helps foals recognise their mothers in the herd. Scientists "
        "believe the stripes also keep biting flies away and confuse predators when the herd runs. In Africa, zebras "
        "migrate hundreds of kilometres every year, following the rains to find fresh grass.",
        "这里是斑马馆。您知道吗？斑马条纹下面的皮肤其实是深色的。每只斑马的条纹都像指纹一样独特，"
        "帮助小斑马在马群中认出自己的妈妈。科学家认为，条纹还能赶走叮咬的苍蝇，并在马群奔跑时让捕食者眼花缭乱。"
        "在非洲，斑马每年都会追随雨季迁徙数百公里，寻找新鲜的青草。"),
    "Hippopotamus amphibius": (
        "Chào mừng bạn đến với hà mã. Tên của chúng có nghĩa là ngựa sông, vì hà mã dành phần lớn ban ngày ngâm mình "
        "dưới nước để giữ mát. Mắt, tai và mũi nằm trên đỉnh đầu nên chúng vẫn nhìn và thở được khi gần như chìm hẳn. "
        "Da hà mã tiết ra một chất nhờn màu đỏ giúp chống nắng tự nhiên. Trông chậm chạp nhưng hà mã có thể chạy khá "
        "nhanh và là một trong những loài động vật nguy hiểm nhất châu Phi.",
        "Welcome to the hippos. Their name means river horse, because hippos spend most of the day in water to keep "
        "cool. Their eyes, ears and nostrils sit on top of the head, so they can see and breathe while almost "
        "completely underwater. A hippo's skin produces a reddish oily liquid that works as a natural sunscreen. They "
        "may look slow, but hippos can run surprisingly fast and are among the most dangerous animals in Africa.",
        "欢迎来到河马馆。河马的名字意思是“河里的马”，因为它们白天大部分时间都泡在水里降温。它们的眼睛、"
        "耳朵和鼻孔都长在头顶，所以几乎整个身体没入水中时也能看东西和呼吸。河马的皮肤会分泌一种红色的油性液体，"
        "是天然的防晒霜。别看它们笨重，河马跑得相当快，是非洲最危险的动物之一。"),
    "Pavo muticus": (
        "Đây là chuồng công lục, loài công bản địa của Việt Nam. Con trống có bộ lông xanh lục ánh kim và chiếc đuôi dài "
        "tới một mét rưỡi. Khi muốn thu hút con mái, con trống xòe đuôi thành hình quạt lớn với hàng trăm đốm tròn như "
        "những con mắt, rồi rung lên tạo tiếng xào xạc. Ban đêm, công bay lên cây cao để ngủ an toàn. Công lục đang "
        "nguy cấp vì bị săn bắt và mất rừng, cần được bảo vệ.",
        "This is the green peafowl enclosure, a peacock native to Vietnam. The male has shimmering green feathers and "
        "a train up to one and a half metres long. To attract a female, he spreads it into a huge fan covered with "
        "hundreds of eye-spots and shakes it to make a rustling sound. At night, peafowl fly up into tall trees to "
        "sleep safely. The green peafowl is endangered by hunting and forest loss and needs our protection.",
        "这里是绿孔雀馆，绿孔雀是越南的本土孔雀。雄孔雀羽毛闪着翠绿的光泽，尾屏长达一米五。为了吸引雌孔雀，"
        "它会把尾屏展开成一把巨大的扇子，上面有数百个像眼睛一样的圆斑，还会抖动尾屏发出沙沙声。"
        "到了晚上，孔雀会飞到高树上安全地睡觉。由于捕猎和森林丧失，绿孔雀已濒临灭绝，需要我们的保护。"),
    "Phoenicopterus roseus": (
        "Chào mừng bạn đến với hồng hạc. Bạn có biết hồng hạc mới nở có lông màu xám không? Màu hồng của chúng đến từ "
        "sắc tố trong tôm nhỏ và tảo mà chúng ăn. Hồng hạc ăn bằng cách lật ngược đầu xuống nước và dùng mỏ lọc thức "
        "ăn. Chúng thường đứng một chân để giữ ấm và tiết kiệm sức lực. Hồng hạc sống thành đàn rất lớn, có khi tới hàng "
        "chục nghìn con, và cả đàn cùng nhảy múa khi tìm bạn đời.",
        "Welcome to the flamingos. Did you know that baby flamingos are grey? Their pink colour comes from pigments in "
        "the tiny shrimp and algae they eat. Flamingos feed by turning their heads upside down in the water and "
        "filtering food with their beaks. They often stand on one leg to stay warm and save energy. Flamingos live in "
        "huge flocks, sometimes tens of thousands strong, and the whole flock dances together when looking for a mate.",
        "欢迎来到火烈鸟馆。您知道吗？刚孵出的小火烈鸟是灰色的。它们的粉红色来自所吃的小虾和藻类中的色素。"
        "火烈鸟进食时会把头倒转放进水里，用喙过滤食物。它们常常单腿站立，以保持体温、节省体力。"
        "火烈鸟成群生活，有时多达数万只，寻找伴侣时整群一起跳舞。"),
    "Struthio camelus": (
        "Đây là đà điểu châu Phi, loài chim lớn nhất thế giới, cao tới hai mét bảy. Đà điểu không bay được nhưng là loài "
        "chim chạy nhanh nhất, đạt khoảng bảy mươi ki lô mét một giờ. Cú đá của chúng đủ mạnh để đuổi cả sư tử. Trứng đà "
        "điểu là quả trứng lớn nhất thế giới, nặng bằng khoảng hai mươi quả trứng gà. Và đà điểu không hề vùi đầu vào "
        "cát, chúng chỉ nằm rạp cổ xuống đất để ẩn mình.",
        "This is the common ostrich, the largest bird in the world at up to two point seven metres tall. Ostriches "
        "cannot fly, but they are the fastest birds on land, reaching about seventy kilometres per hour. Their kick is "
        "strong enough to drive away a lion. An ostrich egg is the biggest egg in the world, as heavy as about twenty "
        "chicken eggs. And no, ostriches do not bury their heads in the sand; they simply lie flat to hide.",
        "这里是非洲鸵鸟，世界上最大的鸟，身高可达二点七米。鸵鸟不会飞，却是陆地上跑得最快的鸟，时速约七十公里。"
        "它们的一脚足以赶走狮子。鸵鸟蛋是世界上最大的蛋，重量相当于大约二十个鸡蛋。"
        "另外，鸵鸟并不会把头埋进沙子里，它们只是把身体平贴地面来隐藏自己。"),
    "Crocodylus siamensis": (
        "Bạn đang đứng trước chuồng cá sấu Xiêm, một trong những loài cá sấu nguy cấp nhất thế giới. Cá sấu Xiêm dài "
        "ba đến bốn mét, có mõm rộng và da màu xanh ô liu. Chúng khá nhút nhát và hiếm khi tấn công người. Ở Việt Nam, "
        "quần thể hoang dã còn lại ở Bàu Sấu, Vườn quốc gia Cát Tiên. Điều đặc biệt là nhiệt độ của ổ trứng sẽ quyết "
        "định cá sấu con nở ra là đực hay cái.",
        "You are in front of the Siamese crocodile, one of the most endangered crocodiles in the world. It grows three "
        "to four metres long, with a broad snout and olive-green skin. It is rather shy and rarely attacks people. In "
        "Vietnam, a wild population survives at Crocodile Lake in Cat Tien National Park. Amazingly, the temperature of "
        "the nest decides whether the baby crocodiles hatch as males or females.",
        "您现在看到的是暹罗鳄，世界上最濒危的鳄鱼之一。暹罗鳄体长三到四米，吻部宽阔，皮肤呈橄榄绿色。"
        "它们性格比较胆小，很少攻击人。在越南，吉仙国家公园的鳄鱼湖里还生活着一个野生种群。"
        "神奇的是，巢穴的温度决定了孵出的小鳄鱼是雄性还是雌性。"),
    "Malayopython reticulatus": (
        "Đây là chuồng trăn gấm, một trong những loài rắn dài nhất thế giới, có con dài gần mười mét. Tên gọi trăn gấm "
        "đến từ hoa văn hình mạng lưới tuyệt đẹp trên da. Trăn không có nọc độc mà giết mồi bằng cách quấn và siết chặt. "
        "Chúng có thể nhịn ăn nhiều tuần sau một bữa no. Trăn gấm mẹ cuộn tròn quanh ổ trứng và co cơ để tạo nhiệt ủ ấm "
        "trứng suốt gần ba tháng.",
        "This is the reticulated python, one of the longest snakes in the world, with some reaching almost ten metres. "
        "Its name comes from the beautiful net-like pattern on its skin. Pythons have no venom; they kill by wrapping "
        "around their prey and squeezing. After a big meal, they can go weeks without eating. The mother coils around "
        "her eggs and shivers her muscles to keep them warm for almost three months.",
        "这里是网纹蟒馆，网纹蟒是世界上最长的蛇之一，有的长近十米。它的名字来自皮肤上美丽的网状花纹。"
        "蟒蛇没有毒，而是靠缠绕并勒紧猎物来捕食。饱餐一顿后，它们可以几个星期不吃东西。"
        "蟒蛇妈妈会盘绕在蛋上，通过肌肉颤动产生热量，为蛋保温将近三个月。"),
    "Ophiophagus hannah": (
        "Hãy cẩn thận, đây là rắn hổ mang chúa, loài rắn độc dài nhất thế giới, có thể dài hơn năm mét. Khi bị đe dọa, "
        "nó dựng cao một phần ba thân mình, bạnh cổ và phát ra tiếng gầm gừ trầm. Tên khoa học của nó có nghĩa là kẻ ăn "
        "rắn, vì thức ăn chính là các loài rắn khác. Hổ mang chúa còn là loài rắn duy nhất biết làm tổ: rắn mẹ gom lá "
        "khô đắp ổ và canh giữ trứng.",
        "Careful, this is the king cobra, the longest venomous snake in the world at over five metres. When threatened, "
        "it raises a third of its body, spreads its hood and makes a deep growling hiss. Its scientific name means snake "
        "eater, because its main food is other snakes. The king cobra is also the only snake that builds a nest: the "
        "mother gathers dry leaves into a mound and guards her eggs.",
        "请注意，这是眼镜王蛇，世界上最长的毒蛇，体长可超过五米。受到威胁时，它会竖起三分之一的身体，"
        "张开颈部，发出低沉的嘶吼。它的学名意思是“吃蛇者”，因为它主要以其他蛇类为食。"
        "眼镜王蛇也是唯一会筑巢的蛇：蛇妈妈会把枯叶堆成巢，并守护自己的蛋。"),
    "Ambystoma mexicanum": (
        "Đây là kỳ giông Mexico, hay còn gọi là axolotl, với khuôn mặt luôn như đang mỉm cười. Chúng giữ hình dạng ấu "
        "trùng suốt đời và thở bằng những chiếc mang ngoài như lông vũ hai bên đầu. Điều kỳ diệu nhất là khả năng tái "
        "tạo: kỳ giông có thể mọc lại chân, đuôi, thậm chí một phần tim và não. Ngoài tự nhiên, chúng chỉ còn sống ở các "
        "kênh nước gần thủ đô Mexico và đang cực kỳ nguy cấp.",
        "This is the Mexican axolotl, with a face that always seems to be smiling. It keeps its larval form for its "
        "whole life and breathes through feathery gills on both sides of its head. Its most amazing ability is "
        "regeneration: an axolotl can regrow its legs, tail and even parts of its heart and brain. In the wild, it "
        "survives only in the canals near Mexico City and is critically endangered.",
        "这是墨西哥钝口螈，也叫六角恐龙，它的脸看起来总是在微笑。它一生都保持幼体的样子，"
        "用头两侧像羽毛一样的外鳃呼吸。它最神奇的本领是再生：能重新长出四肢、尾巴，甚至部分心脏和大脑。"
        "在野外，它只生活在墨西哥城附近的运河里，已经极度濒危。"),
    "Scleropages formosus": (
        "Đây là cá rồng châu Á, loài cá được xem là biểu tượng của may mắn và thịnh vượng. Thân cá dài, vảy lớn óng ánh "
        "màu bạc, vàng hoặc đỏ, và hai chiếc râu ở cằm giống râu rồng. Cá rồng có thể nhảy lên khỏi mặt nước để đớp côn "
        "trùng trên cành cây. Đặc biệt, cá bố ngậm trứng và cá con trong miệng suốt một đến hai tháng mà không ăn gì. "
        "Do bị đánh bắt làm cá cảnh, cá rồng hoang dã đang nguy cấp.",
        "This is the Asian arowana, a fish seen as a symbol of luck and prosperity. It has a long body, large shiny "
        "scales in silver, gold or red, and two chin barbels like a dragon's whiskers. Arowanas can leap out of the "
        "water to catch insects on branches. Remarkably, the father carries the eggs and babies in his mouth for one "
        "to two months without eating. Because of the aquarium trade, wild arowanas are endangered.",
        "这是亚洲龙鱼，被视为好运和财富的象征。它身体修长，鳞片又大又亮，有银色、金色或红色，"
        "下巴上的两根须就像龙须一样。龙鱼能跃出水面，捕食树枝上的昆虫。特别的是，鱼爸爸会把卵和小鱼含在嘴里一到两个月，"
        "期间什么都不吃。由于被大量捕捞作观赏鱼，野生龙鱼已经濒危。"),
}
