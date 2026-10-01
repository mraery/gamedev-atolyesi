import React, { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, Award, HelpCircle, Code2, Sparkles, RefreshCw } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function EngineComparison() {
  const [selectedEngine, setSelectedEngine] = useState('godot');
  const [selectedTopic, setSelectedTopic] = useState('movement');
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState({});

  // Engine comparison data
  const engines = [
    { id: 'godot', name: 'Godot (GDScript)', color: 'border-sky-500 bg-sky-950/30 text-sky-400' },
    { id: 'unity', name: 'Unity (C#)', color: 'border-indigo-500 bg-indigo-950/30 text-indigo-400' },
    { id: 'unreal', name: 'Unreal Engine (C++)', color: 'border-purple-500 bg-purple-950/30 text-purple-400' },
    { id: 'js', name: 'JavaScript (Canvas / Web)', color: 'border-amber-500 bg-amber-950/30 text-amber-400' },
  ];

  const topics = [
    { id: 'movement', label: '1. Hareket & Delta Time' },
    { id: 'collision', label: '2. Çarpışma Algılama' },
    { id: 'spawn', label: '3. Nesne Üretme (Spawn)' },
  ];

  const codeDatabase = {
    movement: {
      godot: {
        code: `extends CharacterBody2D

const SPEED = 300.0
const GRAVITY = 980.0

func _physics_process(delta):
    # 1. Yerçekimi uygula (Delta time ile!)
    if not is_on_floor():
        velocity.y += GRAVITY * delta

    # 2. Tuş girişlerini al (-1, 0, 1)
    var direction = Input.get_axis("ui_left", "ui_right")
    velocity.x = direction * SPEED

    # 3. Hareketi ve çarpışmayı çöz
    move_and_slide()`,
        note: "Godot'ta _physics_process(delta) fonksiyonu her fizik adımında otomatik çağrılır ve delta parametresi verir."
      },
      unity: {
        code: `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 10f;
    public float jumpForce = 12f;
    private Rigidbody2D rb;

    void Start() {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update() {
        // Tuş girişi (-1 ile +1 arası)
        float moveX = Input.GetAxis("Horizontal");
        
        // Hızı ayarla (Fizik motoru Time.deltaTime'ı kendisi çözer)
        rb.linearVelocity = new Vector2(moveX * speed, rb.linearVelocity.y);

        if (Input.GetButtonDown("Jump") && IsGrounded()) {
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
        }
    }
}`,
        note: "Unity'de Update() her çizim karesinde, FixedUpdate() ise sabit aralıklı fizik karelerinde çalışır."
      },
      unreal: {
        code: `void AMyCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // 1. İleri / Geri Hareketi Ekle
    if (Controller != nullptr && MoveForwardValue != 0.0f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FVector Direction = FRotationMatrix(Rotation).GetScaledAxis(EAxis::X);
        AddMovementInput(Direction, MoveForwardValue * DeltaTime);
    }
}`,
        note: "Unreal Engine'de Tick fonksiyonu float DeltaTime parametresi alır. Karakter Hareketi için dahili CharacterMovementComponent kullanılır."
      },
      js: {
        code: `function gameLoop(timestamp) {
    let dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    // 1. Yerçekimi ve Hız
    player.vy += GRAVITY * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // 2. Çizim
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(player.x, player.y, player.w, player.h);

    requestAnimationFrame(gameLoop);
}`,
        note: "JavaScript'te oyun döngüsü tarayıcının yerel requestAnimationFrame() API'si ile kurulur."
      }
    },
    collision: {
      godot: {
        code: `# Coin veya Tuzak (Area2D) nesnesinde:
func _on_body_entered(body):
    if body.is_in_group("Player"):
        Global.score += 100
        $AudioStreamPlayer.play()
        queue_free() # Kendini sahneden sil`,
        note: "Godot'ta tetikleyiciler için Area2D ve on_body_entered sinyali kullanılır."
      },
      unity: {
        code: `void OnTriggerEnter2D(Collider2D other) {
    if (other.CompareTag("Coin")) {
        GameManager.score += 100;
        AudioSource.PlayClipAtPoint(coinSfx, transform.position);
        Destroy(other.gameObject);
    }
}`,
        note: "Unity'de 'Is Trigger' kutucuğu işaretliyse OnTriggerEnter, katı duvarsa OnCollisionEnter çağrılır."
      },
      unreal: {
        code: `void AMyCoin::OnOverlapBegin(UPrimitiveComponent* OverlappedComp, 
                             AActor* OtherActor, 
                             UPrimitiveComponent* OtherComp, 
                             int32 OtherBodyIndex, 
                             bool bFromSweep, 
                             const FHitResult& SweepResult)
{
    if (OtherActor && OtherActor->IsA(APlayerCharacter::StaticClass()))
    {
        UGameplayStatics::PlaySoundAtLocation(this, CoinSound, GetActorLocation());
        Destroy();
    }
}`,
        note: "Unreal Engine'de OnComponentBeginOverlap delegasyonu ile tetikleyici algılanır."
      },
      js: {
        code: `function checkAABB(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}`,
        note: "Web'de saf kodla çalışırken AABB veya daire çarpışma formüllerini doğrudan kendimiz yazarız."
      }
    },
    spawn: {
      godot: {
        code: `# Mermi Üretme (Spawn Bullet):
var bullet_scene = preload("res://Bullet.tscn")

func shoot():
    var bullet = bullet_scene.instantiate()
    bullet.position = muzzle.global_position
    get_tree().current_scene.add_child(bullet)`,
        note: "Godot'ta sahneler instantiate() edilerek ağaca add_child() ile eklenir."
      },
      unity: {
        code: `public GameObject bulletPrefab;
public Transform muzzlePoint;

void Shoot() {
    Instantiate(bulletPrefab, muzzlePoint.position, muzzlePoint.rotation);
}`,
        note: "Unity'de prefab kopyaları Instantiate() fonksiyonu ile sahnede canlandırılır."
      },
      unreal: {
        code: `FActorSpawnParameters SpawnParams;
GetWorld()->SpawnActor<ABullet>(BulletClass, MuzzleLocation, MuzzleRotation, SpawnParams);`,
        note: "Unreal'da SpawnActor fonksiyonu ile yeni bir aktör dünyada yaratılır."
      },
      js: {
        code: `const bullets = [];

function shoot() {
    bullets.push({
        x: player.x,
        y: player.y,
        vx: 400
    });
}`,
        note: "JavaScript'te nesneler diziye (Array) eklenir ve her karede for döngüsüyle güncellenir."
      }
    }
  };

  // 8 In-Depth Quizzes / Real-world Debugging Scenarios
  const questions = [
    {
      id: 'q1',
      title: 'Sorun 1: Hızlı FPS & Duvarın İçinden Geçme (Tunneling)',
      question: 'Bir mermi saniyede 2000 px hızla gidiyor ve 60 FPS\'te her kare 33 piksel atlıyor. 10 piksel kalınlığındaki ince duvardan algılanmadan geçip gidiyor. Bu oyundaki temel hata nedir ve nasıl çözülür?',
      options: [
        { text: 'A) Bilgisayarın ekran kartı yetersizdir, ekran kartı değiştirilmelidir.', correct: false },
        { text: 'B) Raycast (Sürekli Çarpışma / CCD) kullanılarak merminin iki kare arasındaki yolu ışınla taranmalıdır.', correct: true, explain: 'Tebrikler! Mermiler tek karede duvarın üzerinden atladığında (Tunneling), iki konum arasında bir Raycast (ışın) çizilerek yolda bir duvara değip değmediği tespit edilir.' },
        { text: 'C) Delta time formülden çıkarılmalı, sabit 1 eklenmelidir.', correct: false },
      ]
    },
    {
      id: 'q2',
      title: 'Sorun 2: Sonsuz Zıplama Hatası (Infinite Jump Bug)',
      question: 'Oyuncu boşluk tuşuna seri bastığında yerçekimine rağmen kuş gibi gökyüzüne uçuyor. Durum Makinesinde (FSM) hangi kural eksiktir?',
      options: [
        { text: 'A) Zıplama gücünü negatif yapmak gerekir.', correct: false },
        { text: 'B) Zıplama durumu sadece isGrounded == true iken tetiklenmelidir.', correct: true, explain: 'Doğru! Karakter havadayken (isGrounded = false) zıplama komutu reddedilmelidir. Çift zıplama isteniyorsa bir sayaç (jumpCount < 2) konulmalıdır.' },
        { text: 'C) Oyunun FPS hızı 30\'a sabitlenmelidir.', correct: false },
      ]
    },
    {
      id: 'q3',
      title: 'Sorun 3: Makinalı Tüfek ve Donma (Garbage Collection Lag)',
      question: 'Saniyede 500 mermi atan bir oyunda sürekli `new Bullet()` oluşturulup sonra yok edildiğinde (Destroy) oyun anlık donmalar yaşıyor. Oyun mimarisinde bunu çözen altın kural nedir?',
      options: [
        { text: 'A) Object Pooling (Nesne Havuzlama): Mermileri yok etmek yerine önceden havuzda oluşturup gizlemek ve tekrar kullanmak.', correct: true, explain: 'Harika! Sürekli nesne silip oluşturmak RAM bellekte çöp toplayıcıyı (Garbage Collector) yorar ve oyunda takılmalara (lag spike) yol açar. Object Pooling oyun mimarisinin temel taşlarındandır.' },
        { text: 'B) Mermilerin grafik kalitesini düşürmek.', correct: false },
        { text: 'C) Çarpışma kutularını kaldırmak.', correct: false },
      ]
    },
    {
      id: 'q4',
      title: 'Sorun 4: 144 Hz Monitörde Oyunun Jet Gibi Hızlanması',
      question: 'Geliştiricinin bilgisayarında (60 Hz) normal hızda olan oyun, oyuncunun 144 Hz monitöründe 2.5 kat daha hızlı koşuyor. Geliştirici neyi yapmayı unuttu?',
      options: [
        { text: 'A) Hareketi deltaTime ile çarpmayı unuttu (x += hiz yerine x += hiz * dt yazmalıydı).', correct: true, explain: 'Kesinlikle doğru! DeltaTime ile çarpılmayan her hareket doğrudan monitörün kare sayısına (FPS) bağlanır ve yüksek yenileme hızında oyun hızlanır.' },
        { text: 'B) Oyuncunun ekran parlaklığını kısmayı unuttu.', correct: false },
        { text: 'C) Çarpışma kutusunun genişliğini artırmayı unuttu.', correct: false },
      ]
    },
    {
      id: 'q5',
      title: 'Sorun 5: Fizik Titremesi & Sabit Zaman Adımı (Fixed Timestep)',
      question: 'Unity\'de Update() fonksiyonunda fizik hesaplamaları yapıldığında kare hızı dalgalanınca kutular titriyor ve bazen zemine saplanıyor. Neden fizik hesapları FixedUpdate() (Sabit Zaman Adımı) içinde yapılmalıdır?',
      options: [
        { text: 'A) Çünkü FixedUpdate her zaman sabit zaman aralığında (örn: tam 50 Hz = 0.02s) çalışır, matematiksel integral hatası oluşmaz.', correct: true, explain: 'Doğru! Çizim kareleri dalgalanabilir (120 FPS -> 45 FPS), ancak fizik simülasyonu kararlı kalabilmek için deterministik ve sabit bir zaman adımı (Fixed Timestep) gerektirir.' },
        { text: 'B) Çünkü FixedUpdate sadece 3D oyunlar içindir.', correct: false },
        { text: 'C) Çünkü Update fonksiyonu ekran kartını yakabilir.', correct: false },
      ]
    },
    {
      id: 'q6',
      title: 'Sorun 6: 10.000 Düşman ve Çarpışma Donması (O(N^2) Problemi)',
      question: 'Ekranda 5.000 düşman olduğunda oyun donuyor çünkü her düşman diğer 4.999 düşmanla çarpışıyor mu diye bakılıyor (25 milyon kontrol!). Bu performans darboğazı nasıl çözülür?',
      options: [
        { text: 'A) Uzaysal Bölümleme (Spatial Partitioning / Quadtree veya Grid): Haritayı bölgelere bölüp sadece aynı bölgedeki nesneleri kontrol etmek.', correct: true, explain: 'Tebrikler! Quadtree (Dörtlü Ağaç) veya Spatial Grid sayesinde haritanın sol ucundaki düşmanla sağ ucundaki düşman hiç karşılaştırılmaz. Karmaşıklık O(N^2)\'den O(N log N)\'e düşer.' },
        { text: 'B) Düşmanların canını 1 yapmak.', correct: false },
        { text: 'C) Bilgisayarın fan hızını artırmak.', correct: false },
      ]
    },
    {
      id: 'q7',
      title: 'Sorun 7: Çizim Çağrısı (Draw Call) ve Texture Atlas (Sprite Sheet)',
      question: 'Oyundaki 200 farklı eşya ve karakter görseli ayrı ayrı PNG dosyalarından yüklendiğinde oyunun FPS değeri çöküyor. Oyun motorlarında bu neden olur ve çözümü nedir?',
      options: [
        { text: 'A) Her görsel için ekran kartına ayrı Draw Call (Çizim Emri) gider; tüm görseller tek bir büyük Sprite Sheet (Texture Atlas) dosyasında birleştirilmelidir.', correct: true, explain: 'Harika! Ekran kartı her farklı resim için doku değiştirirken (context switch) zaman kaybeder. Tüm görseller tek bir Atlas\'a konursa tek bir çizim çağrısıyla (Batching) binlerce nesne anında çizilir.' },
        { text: 'B) PNG yerine GIF kullanılmalıdır.', correct: false },
        { text: 'C) Görsellerin siyah beyaz yapılması gerekir.', correct: false },
      ]
    },
    {
      id: 'q8',
      title: 'Sorun 8: Arayüz (UI) ve Olay Güdümlü Mimari (Observer / Events)',
      question: 'Can barı gösteren bir UI metninin her karede (Update içinde) `text = player.hp` şeklinde sorgulanması (Polling) neden kötü bir mimaridir ve profesyonel yaklaşım nedir?',
      options: [
        { text: 'A) Can değeri saniyede 60 kez değişmez; bunun yerine oyuncu sadece hasar aldığında `OnHealthChanged` olayı (Event) tetiklenmeli ve UI sadece o zaman güncellenmelidir.', correct: true, explain: 'Mükemmel! Olay güdümlü mimari (Event-driven / C# Action / Godot Signal) gereksiz string işlemlerini ve CPU döngülerini önler, kod bağımlılığını (Decoupling) sıfıra indirir.' },
        { text: 'B) Çünkü can barı metinle değil sadece resimle çizilmelidir.', correct: false },
        { text: 'C) Çünkü can barı oyunun başında bir kez gösterilip gizlenmelidir.', correct: false },
      ]
    }
  ];

  const handleAnswer = (qId, optionIdx, isCorrect) => {
    if (answeredQuestions[qId] !== undefined) return;

    if (isCorrect) {
      sounds.coin();
      setQuizScore(s => s + 125);
    } else {
      sounds.hit();
    }

    setAnsweredQuestions(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleResetQuiz = () => {
    sounds.click();
    setAnsweredQuestions({});
    setQuizScore(0);
  };

  const answeredCount = Object.keys(answeredQuestions).length;

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/30 p-6 rounded-2xl border border-indigo-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            7. Oyun Motorları Rosetta Taşı & Geliştirici Sınavı
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Öğrendiğiniz tüm bu temel mantıklar (Game Loop, Delta Time, AABB, ECS, Raycast, Quadtree, Object Pooling) 
          <strong> tüm oyun motorlarında tamamen aynıdır</strong>. Sadece sözdizimi değişir! 
          Aşağıdan motorlar arası kod çevirilerini inceleyin ve 8 soruluk gerçek geliştirici sınavında bilginizi test edin!
        </p>
      </div>

      {/* SECTION 1: ROSETTA STONE CODE VIEWER */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Oyun Motorları Karşılaştırması (Rosetta Stone)</h3>
          </div>

          {/* Topic selector */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  sounds.click();
                  setSelectedTopic(t.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedTopic === t.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Engine Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {engines.map(eng => {
            const isSel = selectedEngine === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => {
                  sounds.click();
                  setSelectedEngine(eng.id);
                }}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isSel ? `${eng.color} ring-2 ring-indigo-500/40 shadow-lg` : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>{eng.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Engine Code Snippet */}
        <div>
          <CodeSnippetViewer
            title={`${engines.find(e => e.id === selectedEngine).name} Örneği`}
            language={selectedEngine === 'godot' ? 'gdscript' : selectedEngine === 'unity' ? 'csharp' : selectedEngine === 'unreal' ? 'cpp' : 'javascript'}
            code={codeDatabase[selectedTopic][selectedEngine].code}
            note={codeDatabase[selectedTopic][selectedEngine].note}
          />
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE GAMEDEV CHALLENGES & QUIZ */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Geliştirici Sınavı & Mimari Hata Çözme</h3>
              <p className="text-xs text-slate-400">
                Tamamlanan: {answeredCount} / {questions.length} Soru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-slate-950 text-amber-400 px-4 py-2 rounded-xl border border-slate-800 shadow-md">
              Skor: {quizScore} / 1000 Puan
            </span>
            <button
              onClick={handleResetQuiz}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
              title="Sınavı Sıfırla"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Badge on 1000 pts */}
        {quizScore >= 1000 && (
          <div className="p-4 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-sky-500/20 border border-amber-500/40 rounded-2xl text-center space-y-2 animate-fadeIn">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-black text-amber-300">🏆 OYUN MİMARI SERTİFİKASI KAZANILDI!</h4>
            <p className="text-xs text-slate-200">
              Delta Time, FSM, Object Pooling, Quadtree, Raycasting ve Event Mimarisi konularında tüm soruları eksiksiz tamamladınız!
            </p>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-6">
          {questions.map((q) => {
            const userChoice = answeredQuestions[q.id];
            const isAnswered = userChoice !== undefined;

            return (
              <div key={q.id} className="p-5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {q.title}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                  {q.question}
                </p>

                {/* Options */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, oIdx) => {
                    let btnStyle = 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800';

                    if (isAnswered) {
                      if (opt.correct) {
                        btnStyle = 'border-emerald-500 bg-emerald-950/50 text-emerald-200 font-bold';
                      } else if (userChoice === oIdx && !opt.correct) {
                        btnStyle = 'border-rose-500 bg-rose-950/50 text-rose-200';
                      } else {
                        btnStyle = 'border-slate-800 bg-slate-900 text-slate-500 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswered}
                        onClick={() => handleAnswer(q.id, oIdx, opt.correct)}
                        className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt.text}</span>
                        {isAnswered && opt.correct && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                        {isAnswered && userChoice === oIdx && !opt.correct && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on answered */}
                {isAnswered && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 animate-fadeIn">
                    <span className="font-bold text-indigo-300 block mb-1">💡 Çözüm Analizi:</span>
                    {q.options.find(o => o.correct)?.explain}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
