#include "ASDCDuelHUD.h"
#include "ASDCDuelGameMode.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
void AASDCDuelHUD::DrawHUD(){
 Super::DrawHUD();
 if(!Canvas)return;
 auto* GM=GetWorld()->GetAuthGameMode<AASDCDuelGameMode>();
 if(!GM)return;
 const float W=Canvas->SizeX,H=Canvas->SizeY;
 const float S=FMath::Max(.7f,FMath::Min(W/1440.f,H/900.f));
 UFont* Font=GEngine?GEngine->GetSmallFont():nullptr;
 auto Text=[&](const FString& T,float X,float Y,FLinearColor C,float Scale=1.f){
  DrawText(T,C,X,Y,Font,S*Scale,false);
 };
 DrawRect(FLinearColor(.025f,.048f,.08f,.92f),0,0,W,106*S);
 Text(TEXT("AFTER SCHOOL DUEL CLUB   /   UNREAL NATIVE R001"),34*S,19*S,FLinearColor(.96f,.87f,.66f),1.6f);
 Text(FString::Printf(TEXT("M01 MUSIC TEACHER  %d/20"),GM->PlayerHP),34*S,72*S,FLinearColor(.65f,.89f,.97f),1.2f);
 Text(FString::Printf(TEXT("M02 CAFETERIA AUNT  %d/20"),GM->OpponentHP),W-345*S,72*S,FLinearColor(.99f,.67f,.63f),1.2f);
 DrawRect(FLinearColor(.035f,.06f,.10f,.92f),0,H-200*S,W,200*S);
 Text(FString::Printf(TEXT("TURN %d   |   SHIELD %d"),GM->Turn,GM->Shield),35*S,H-187*S,FLinearColor(.94f,.90f,.77f),1.25f);
 Text(GM->StatusLine,35*S,H-154*S,FLinearColor(.73f,.88f,.99f),1.f);
 const TCHAR* Cards[3]={TEXT("1  SOUND PULSE     3 DAMAGE"),
                        TEXT("2  BOOKSTORM       5 DAMAGE"),
                        TEXT("3  STAGE SHIELD    +4 BLOCK")};
 for(int i=0;i<3;++i){
  float Left=(34.f+i*465.f)*S;
  DrawRect(i==0?FLinearColor(.14f,.30f,.40f,1):i==1?
   FLinearColor(.39f,.24f,.26f,1):FLinearColor(.24f,.29f,.20f,1),
   Left,H-108*S,434*S,80*S);
  Text(Cards[i],Left+17*S,H-82*S,FLinearColor::White,1.05f);
 }
 if(!GM->OutcomeLine.IsEmpty()){
  DrawRect(FLinearColor(.05f,.07f,.10f,.9f),W*.26f,H*.33f,W*.48f,125*S);
  Text(GM->OutcomeLine,W*.31f,H*.37f,FLinearColor(.98f,.86f,.53f),1.8f);
 }
}
